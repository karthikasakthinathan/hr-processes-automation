from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from datetime import date, datetime
from core.security import verify_firebase_token
from core.tenant import get_company_from_token
from database import get_db  # now a context manager

router = APIRouter(prefix="/exit", tags=["Exit Management"])


class ExitApplySchema(BaseModel):
    employee_id: str
    reason: str
    detailed_reason: str | None = None
    last_working_date: str
    notice_period_days: int


STATUS_STAGE_MAP = {
    "Resignation Submitted": 1,
    "Notice Period":         1,
    "Processing":            1,
    "Manager Approved":      2,
    "Manager Approval":      2,
    "HR Approved":           2,
    "HR Approval":           2,
    "Final Settlement":      3,
    "Completed":             3,
}


@router.post("/apply")
def apply_exit(
    data: ExitApplySchema,
    decoded_token=Depends(verify_firebase_token)
):
    company_code = get_company_from_token(decoded_token)
    firebase_uid = decoded_token["uid"]

    # ✅ 'with' block guarantees db.close() runs even if an exception occurs
    with get_db(company_code) as db:
        db.execute(
            text("""
            INSERT INTO exit_requests
                (employee_id, firebase_uid, reason, detailed_reason, notice_period_days,
                 last_working_date, start_date, status)
            VALUES
                (:employee_id, :uid, :reason, :detailed_reason, :notice_days,
                 :lwd, :today, 'Resignation Submitted')
            """),
            {
                "employee_id":     data.employee_id,
                "uid":             firebase_uid,
                "reason":          data.reason,
                "detailed_reason": data.detailed_reason,
                "notice_days":     data.notice_period_days,
                "lwd":             data.last_working_date,
                "today":           date.today()
            }
        )
        # commit() is called automatically by the context manager on success
    return {"message": "Exit Applied Successfully"}


@router.get("/notice-info")
def notice_info(decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)
    firebase_uid = decoded_token["uid"]

    with get_db(company_code) as db:
        row = db.execute(
            text("""
            SELECT employee_id, notice_period_days, start_date, last_working_date
            FROM exit_requests
            WHERE firebase_uid = :uid
            ORDER BY id DESC LIMIT 1
            """),
            {"uid": firebase_uid}
        ).fetchone()

    if not row:
        return {}

    today = date.today()
    remaining_days = max((row[3] - today).days, 0)

    return {
        "emp_id":             row[0],
        "notice_period_days": row[1],
        "start_date":         str(row[2]) if row[2] else "",
        "end_date":           str(row[3]) if row[3] else "",
        "remaining_days":     remaining_days
    }


@router.get("/status")
def exit_status(decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)
    firebase_uid = decoded_token["uid"]

    with get_db(company_code) as db:
        row = db.execute(
            text("""
            SELECT status FROM exit_requests
            WHERE firebase_uid = :uid
            ORDER BY id DESC LIMIT 1
            """),
            {"uid": firebase_uid}
        ).fetchone()

    if not row:
        return {"status": None, "stage": 0}

    status = row[0]
    stage = STATUS_STAGE_MAP.get(status, 1)
    return {"status": status, "stage": stage}


@router.get("/all")
def get_all_exit_requests(decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    with get_db(company_code) as db:
        result = db.execute(text("""
            SELECT id, employee_id, reason, notice_period_days,
                   start_date, last_working_date, status
            FROM exit_requests
            ORDER BY id DESC
        """)).mappings().all()

    return {"data": [dict(r) for r in result]}


@router.get("/all-active")
def get_all_active_exits(decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    with get_db(company_code) as db:
        result = db.execute(text("""
            SELECT id, employee_id, reason, notice_period_days,
                   start_date, last_working_date, status
            FROM exit_requests
            ORDER BY id DESC
        """)).mappings().all()
        rows = [dict(r) for r in result]  # read before session closes

    today = date.today()
    data = []
    for row in rows:
        lwd    = row["last_working_date"]
        status = row["status"] or "Resignation Submitted"

        start = row["start_date"]
        if isinstance(start, str) and start:
            start = datetime.strptime(start, "%Y-%m-%d").date()

        total     = row["notice_period_days"] or 60
        done      = max((today - start).days, 0) if start else 0
        remaining = max(total - done, 0)
        progress  = min(100, max(0, (done / total) * 100))
        stage     = STATUS_STAGE_MAP.get(status, 1)

        data.append({
            "id":                 row["id"],
            "employee_id":        row["employee_id"],
            "reason":             row["reason"],
            "notice_period_days": total,
            "start_date":         str(start) if start else "",
            "end_date":           str(lwd) if lwd else "",
            "remaining_days":     remaining,
            "progress":           round(progress, 1),
            "status":             status,
            "stage":              stage,
        })

    return {"data": data}