"""
bulk_upload.py
--------------
Processes an Excel workbook (already parsed into a dict of DataFrames) and
inserts rows into the corresponding HRMS database tables.

Sheet name  →  DB table mapping + per-column rules are defined in SHEET_CONFIG.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import pandas as pd
from schemas import BulkUploadResponse, SheetResult

try:
    from sqlalchemy import text as sa_text
    from sqlalchemy.orm import Session
except ModuleNotFoundError:
    sa_text = None
    Session = object

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Central configuration: one entry per supported sheet / table
# ---------------------------------------------------------------------------
SHEET_CONFIG: dict[str, dict[str, Any]] = {
    "recruitment_candidates": {
        "table": "recruitment_candidates",
        "columns": ["job_id", "name", "email", "skills", "experience_years", "status"],
        "required": ["name"],
    },
    "recruitment_jobs": {
        "table": "recruitment_jobs",
        "columns": ["title", "location", "description"],
        "required": ["title"],
    },
    "employees": {
        "table": "employees",
        "columns": ["employee_id", "name", "job_title", "email", "location", "status"],
        "required": ["employee_id", "name"],
    },
    "onboarding": {
        "table": "onboarding",
        "columns": [
            "employee_id", "offer_date", "joining_date",
            "documents", "training_status", "onboarding_status",
        ],
        "required": ["employee_id"],
    },
    "attendance": {
        "table": "attendance",
        "columns": ["employee_id", "date", "status", "check_in", "check_out"],
        "required": ["employee_id", "date"],
    },
    "payroll": {
        "table": "payroll",
        "columns": ["employee_id", "month", "basic_salary", "deductions", "net_salary"],
        "required": ["employee_id", "month"],
    },
    "leaves": {
        "table": "leaves",
        "columns": ["employee_id", "start_date", "end_date", "reason", "status"],
        "required": ["employee_id", "start_date", "end_date"],
    },
    "hr_tickets": {
        "table": "hr_tickets",
        "columns": ["employee_id", "subject", "category", "description", "status"],
        "required": ["employee_id", "subject"],
    },
    "exit_requests": {
        "table": "exit_requests",
        "columns": ["employee_id", "reason", "start_date",
                    "last_working_date", "notice_period_days", "status"],
        "required": ["employee_id"],
    },
    "ai_test_attendance": {
        "table": "ai_test_attendance",
        "columns": ["employee_id", "date", "status", "check_in"],
        "required": ["employee_id", "date"],
    },
    "ai_test_leaves": {
        "table": "ai_test_leaves",
        "columns": ["employee_id", "start_date", "end_date", "reason",
                    "status", "total_leaves", "taking_leave_days"],
        "required": ["employee_id", "start_date"],
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Lowercase & strip whitespace from column headers."""
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]
    return df


def _clean_value(val: Any) -> str | None:
    """Convert a cell value to a clean string, returning None for blanks."""
    if pd.isna(val) or str(val).strip() in ("", "nan", "NaT", "None"):
        return None
    return str(val).strip()


# ✅ NEW: handles skills JSON conversion
def _clean_value_for_column(col: str, val: Any) -> str | None:
    """Clean value and apply column-specific transformations."""
    if pd.isna(val) or str(val).strip() in ("", "nan", "NaT", "None"):
        return None
    cleaned = str(val).strip()
    # ✅ Convert comma-separated skills to JSON array for DB
    if col == "skills" and cleaned:
        return json.dumps([s.strip() for s in cleaned.split(",")])
    return cleaned


def _build_insert_sql(table: str, columns: list[str]) -> str:
    """Generate a parameterised INSERT statement for the given table + columns."""
    cols_sql = ", ".join(columns)
    params_sql = ", ".join(f":{col}" for col in columns)
    return f"INSERT INTO {table} ({cols_sql}) VALUES ({params_sql})"


def _validate_row(row_data: dict[str, Any], required: list[str], row_num: int) -> str | None:
    """Return an error message if a required field is missing, else None."""
    for field in required:
        if row_data.get(field) is None:
            return f"Row {row_num}: required field '{field}' is empty."
    return None


# ---------------------------------------------------------------------------
# Per-sheet processor
# ---------------------------------------------------------------------------

def _process_sheet(
    session: Session,
    sheet_name: str,
    df: pd.DataFrame,
    cfg: dict[str, Any],
) -> SheetResult:
    """Insert all valid rows from one DataFrame into the corresponding table."""

    table = cfg["table"]
    expected_cols: list[str] = cfg["columns"]
    required: list[str] = cfg.get("required", [])

    df = _normalise_columns(df)

    present_cols = [c for c in expected_cols if c in df.columns]
    missing_from_sheet = [c for c in expected_cols if c not in df.columns]

    if missing_from_sheet:
        logger.warning(
            "Sheet '%s': columns not found in file and will be skipped: %s",
            sheet_name, missing_from_sheet,
        )

    if not present_cols:
        return SheetResult(
            sheet=sheet_name,
            table=table,
            rows_inserted=0,
            rows_skipped=0,
            errors=[f"None of the expected columns found. Expected: {expected_cols}"],
        )

    missing_required = [c for c in required if c not in df.columns]
    if missing_required:
        return SheetResult(
            sheet=sheet_name,
            table=table,
            rows_inserted=0,
            rows_skipped=len(df),
            errors=[f"Required column(s) missing from sheet: {missing_required}"],
        )

    raw_sql = _build_insert_sql(table, present_cols)
    insert_sql = sa_text(raw_sql) if sa_text is not None else raw_sql
    inserted = skipped = 0
    errors: list[str] = []

    for idx, row in df.iterrows():
        row_num = int(idx) + 2

        # ✅ FIXED: use _clean_value_for_column instead of _clean_value
        row_data = {col: _clean_value_for_column(col, row.get(col)) for col in present_cols}

        err = _validate_row(row_data, [r for r in required if r in present_cols], row_num)
        if err:
            errors.append(err)
            skipped += 1
            logger.debug("Skipped — %s", err)
            continue

        try:
            session.execute(insert_sql, row_data)
            inserted += 1
        except Exception as exc:
            err_msg = f"Row {row_num}: DB error — {exc}"
            errors.append(err_msg)
            skipped += 1
            logger.error(err_msg)

    return SheetResult(
        sheet=sheet_name,
        table=table,
        rows_inserted=inserted,
        rows_skipped=skipped,
        errors=errors,
    )


# ---------------------------------------------------------------------------
# Entry point called by the route handler
# ---------------------------------------------------------------------------

def process_excel_upload(
    session: Session,
    sheets: dict[str, pd.DataFrame],
) -> BulkUploadResponse:
    """
    Iterate over all sheets in the workbook.
    Recognised sheets are processed; unrecognised ones are reported but ignored.
    The session is NOT committed here — the caller (route) controls that.
    """

    results: list[SheetResult] = []
    skipped_sheets: list[str] = []
    total_inserted = total_skipped = 0

    for sheet_name, df in sheets.items():
        normalised_name = sheet_name.strip().lower().replace(" ", "_")
        cfg = SHEET_CONFIG.get(normalised_name)

        if cfg is None:
            logger.warning("Sheet '%s' not recognised — skipping.", sheet_name)
            skipped_sheets.append(sheet_name)
            continue

        logger.info("Processing sheet '%s' → table '%s' (%d rows)", sheet_name, cfg["table"], len(df))

        if df.empty:
            results.append(
                SheetResult(
                    sheet=sheet_name,
                    table=cfg["table"],
                    rows_inserted=0,
                    rows_skipped=0,
                    errors=["Sheet is empty."],
                )
            )
            continue

        result = _process_sheet(session, sheet_name, df, cfg)
        results.append(result)
        total_inserted += result.rows_inserted
        total_skipped += result.rows_skipped

    overall_success = all(r.rows_inserted > 0 or r.rows_skipped == 0 for r in results)

    return BulkUploadResponse(
        success=overall_success,
        message=(
            f"Upload complete. {total_inserted} row(s) inserted, "
            f"{total_skipped} row(s) skipped across {len(results)} sheet(s)."
        ),
        total_inserted=total_inserted,
        total_skipped=total_skipped,
        sheets_processed=len(results),
        sheets_skipped=skipped_sheets,
        results=results,
    )