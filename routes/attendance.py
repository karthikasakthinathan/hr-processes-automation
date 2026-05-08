"""
ai_attendance.py  — FIXED VERSION
────────────────────────────────────────────────────────────────────────────────
TABLE SEPARATION (FINAL):
  - attendance / leaves tables      → mark-attendance, records, apply-leave,
                                       leave-status, leave-balance (normal flow)
  - ai_test_attendance / ai_test_leaves → ai-patterns ONLY (AI burnout scan)

OTHER FIXES:
  1. AI pattern cutoff dynamically uses MIN(date) from ai_test_attendance
     so historical data (e.g. 2025) is always scanned — not just last 30 days.
  2. Decision string unified: "escalate_to_manager" across all routes.
  3. rejection_reason (string) returned alongside rejection_reasons (array).
────────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from database import get_db
from core.security import verify_firebase_token
from core.tenant import get_company_from_token
from groq import Groq
from datetime import date, datetime, timedelta
from collections import defaultdict
import os

# ── Groq client ───────────────────────────────────────────────────────────────

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

router = APIRouter(prefix="/attendance", tags=["Attendance & Leave"])

# ── Constants ─────────────────────────────────────────────────────────────────
TEAM_CAPACITY_THRESHOLD     = 0.70
CRITICAL_CAPACITY_THRESHOLD = 0.50
LATE_ARRIVAL_HOUR           = 10
LATE_ARRIVAL_STREAK         = 3
SICK_LEAVE_SPIKE_DAYS       = 3
DEFAULT_TOTAL_LEAVES        = 10

SICK_KEYWORDS = [
    "sick", "medical", "health", "fever", "unwell",
    "hospital", "doctor", "ill", "injury", "surgery", "flu", "covid"
]


# ═════════════════════════════════════════════════════════════════════════════
# SCHEMAS
# ═════════════════════════════════════════════════════════════════════════════

class AttendanceCreate(BaseModel):
    employee_id: str
    date: str
    status: str
    check_in: str

class LeaveCreate(BaseModel):
    employee_id: str
    start_date: str
    end_date: str
    reason: str
    total_leaves: int = DEFAULT_TOTAL_LEAVES

class LeaveApprovalRequest(BaseModel):
    employee_id: str
    start_date: str
    end_date: str
    reason: str
    total_leaves: int = DEFAULT_TOTAL_LEAVES


# ═════════════════════════════════════════════════════════════════════════════
# HELPER — GROQ EXPLANATION
# ═════════════════════════════════════════════════════════════════════════════

def _ai_explain(prompt: str, fallback: str) -> str:
    if not client:
        return fallback
    try:
        r = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content":
                    "You are an HR assistant. Give a concise, professional 2-sentence "
                    "explanation for an automated HR decision. No bullet points."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=120,
            temperature=0.3,
        )
        return r.choices[0].message.content.strip()
    except Exception:
        return fallback


# ═════════════════════════════════════════════════════════════════════════════
# HELPER — CALCULATE LEAVE DAYS
# ═════════════════════════════════════════════════════════════════════════════

def _calc_leave_days(start_date: str, end_date: str) -> int:
    s = datetime.strptime(start_date, "%Y-%m-%d").date()
    e = datetime.strptime(end_date,   "%Y-%m-%d").date()
    return max(1, (e - s).days + 1)


# ═════════════════════════════════════════════════════════════════════════════
# HELPER — LEAVE BALANCE CHECK
# ═════════════════════════════════════════════════════════════════════════════

def _get_leave_balance(db, employee_id: str, total_leaves: int) -> dict:
    already_taken = db.execute(text("""
        SELECT COALESCE(SUM(taking_leave_days), 0)
        FROM leaves
        WHERE employee_id = :emp
          AND status IN ('Approved', 'Pending')
    """), {"emp": employee_id}).scalar() or 0

    remaining = total_leaves - already_taken
    return {
        "total_leaves": total_leaves,
        "already_taken": int(already_taken),
        "remaining": int(remaining),
    }


# ═════════════════════════════════════════════════════════════════════════════
# HELPER — CAPACITY CHECK
# ═════════════════════════════════════════════════════════════════════════════

def _get_capacity_for_dates(db, start_date: str, end_date: str) -> dict:
    total = db.execute(
        text("SELECT COUNT(*) FROM employees WHERE status='Active'")
    ).scalar() or 1

    result = db.execute(text("""
        SELECT date, COUNT(*) as out_count
        FROM attendance
        WHERE status IN ('Absent','Leave')
          AND date BETWEEN :s AND :e
        GROUP BY date
    """), {"s": start_date, "e": end_date}).fetchall()

    leave_result = db.execute(text("""
        SELECT start_date, end_date FROM leaves
        WHERE status = 'Approved'
          AND start_date <= :e AND end_date >= :s
    """), {"s": start_date, "e": end_date}).fetchall()

    out_map: dict[str, int] = defaultdict(int)
    for row in result:
        out_map[str(row[0])] += row[1]

    s = datetime.strptime(start_date, "%Y-%m-%d").date()
    e = datetime.strptime(end_date,   "%Y-%m-%d").date()
    for lv in leave_result:
        ls = datetime.strptime(str(lv[0]), "%Y-%m-%d").date()
        le = datetime.strptime(str(lv[1]), "%Y-%m-%d").date()
        d = max(s, ls)
        while d <= min(e, le):
            out_map[str(d)] += 1
            d += timedelta(days=1)

    min_capacity = 1.0
    d = s
    while d <= e:
        out = out_map.get(str(d), 0) + 1
        cap = max(0.0, (total - out) / total)
        min_capacity = min(min_capacity, cap)
        d += timedelta(days=1)

    return {
        "total_employees": total,
        "min_capacity_ratio": round(min_capacity, 3),
        "threshold": TEAM_CAPACITY_THRESHOLD,
        "sufficient": min_capacity >= TEAM_CAPACITY_THRESHOLD,
        "critical": min_capacity < CRITICAL_CAPACITY_THRESHOLD,
    }


# ═════════════════════════════════════════════════════════════════════════════
# HELPER — PARSE CHECK-IN TIME
# ═════════════════════════════════════════════════════════════════════════════

def _parse_hour_minute(check_in: str):
    try:
        ci = check_in.strip().replace("T", " ")
        time_part = ci.split(" ")[-1]
        parts = time_part.split(":")
        return int(parts[0]), int(parts[1])
    except (ValueError, IndexError, AttributeError):
        return None, None


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE 1 — MARK ATTENDANCE
# ═════════════════════════════════════════════════════════════════════════════

@router.post("/mark-attendance")
def mark_attendance(data: AttendanceCreate,
                    decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED
    with get_db(company_code) as db:
        db.execute(text("""
            INSERT INTO attendance (employee_id, date, status, check_in)
            VALUES (:employee_id, :date, :status, :check_in)
        """), data.dict())
        # commit() called automatically

    return {"message": "Attendance Marked Successfully"}


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE 2 — ATTENDANCE RECORDS
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/records")
def get_attendance(decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED
    with get_db(company_code) as db:
        result = db.execute(text("""
            SELECT employee_id, date, status, check_in
            FROM attendance ORDER BY date DESC
        """))
        data = [dict(r._mapping) for r in result]

    return {"data": data}


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE 3 — APPLY LEAVE
# ═════════════════════════════════════════════════════════════════════════════

@router.post("/apply-leave")
def apply_leave(data: LeaveCreate,
                decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED — single 'with' block covers all DB calls in this route
    with get_db(company_code) as db:
        taking_leave_days = _calc_leave_days(data.start_date, data.end_date)
        balance = _get_leave_balance(db, data.employee_id, data.total_leaves)

        if taking_leave_days > balance["remaining"]:
            rejection_reason = (
                f"Insufficient leave balance. Requested {taking_leave_days} day(s) "
                f"but only {balance['remaining']} day(s) remaining "
                f"out of {data.total_leaves} total annual leaves."
            )
            explanation = _ai_explain(
                f"Reject leave for employee {data.employee_id} due to insufficient balance. "
                f"Requested {taking_leave_days} days, only {balance['remaining']} remaining.",
                rejection_reason
            )
            db.execute(text("""
                INSERT INTO leaves
                    (employee_id, start_date, end_date, reason,
                     status, total_leaves, taking_leave_days)
                VALUES
                    (:employee_id, :start_date, :end_date, :reason,
                     :status, :total_leaves, :taking_leave_days)
            """), {
                **data.dict(),
                "status": "Rejected",
                "taking_leave_days": taking_leave_days,
            })
            # commit() called by context manager
            return {
                "message": "Leave request rejected",
                "decision": "auto_rejected",
                "status": "Rejected",
                "rejection_reason": rejection_reason,
                "rejection_reasons": [rejection_reason],
                "explanation": explanation,
                "leave_balance": {**balance, "requested": taking_leave_days},
            }

        cap = _get_capacity_for_dates(db, data.start_date, data.end_date)

        if cap["sufficient"]:
            status = "Approved"
            decision = "auto_approved"
            rejection_reason = None
            explanation = _ai_explain(
                f"Auto-approve leave for {data.employee_id} from {data.start_date} "
                f"to {data.end_date} ({taking_leave_days} day(s)). Reason: {data.reason}. "
                f"Team capacity: {cap['min_capacity_ratio']*100:.0f}%.",
                f"Leave approved for {taking_leave_days} day(s). Team capacity "
                f"({cap['min_capacity_ratio']*100:.0f}%) remains above threshold."
            )
        elif cap["critical"]:
            status = "Rejected"
            decision = "auto_rejected"
            rejection_reason = (
                f"Team capacity would critically drop to "
                f"{cap['min_capacity_ratio']*100:.0f}%, which is below the "
                f"minimum {CRITICAL_CAPACITY_THRESHOLD*100:.0f}% threshold. "
                f"Please reschedule your leave."
            )
            explanation = _ai_explain(
                f"Reject leave for {data.employee_id}. Team capacity would fall to "
                f"{cap['min_capacity_ratio']*100:.0f}%, critically below the "
                f"{CRITICAL_CAPACITY_THRESHOLD*100:.0f}% minimum.",
                rejection_reason
            )
        else:
            status = "Pending"
            decision = "escalate_to_manager"
            rejection_reason = None
            explanation = _ai_explain(
                f"Escalate leave for {data.employee_id} ({data.start_date} to {data.end_date}). "
                f"Capacity would drop to {cap['min_capacity_ratio']*100:.0f}%, "
                f"below the {TEAM_CAPACITY_THRESHOLD*100:.0f}% threshold.",
                f"Sent to manager for review — capacity would fall to "
                f"{cap['min_capacity_ratio']*100:.0f}%, below the "
                f"{TEAM_CAPACITY_THRESHOLD*100:.0f}% minimum."
            )

        db.execute(text("""
            INSERT INTO leaves
                (employee_id, start_date, end_date, reason,
                 status, total_leaves, taking_leave_days)
            VALUES
                (:employee_id, :start_date, :end_date, :reason,
                 :status, :total_leaves, :taking_leave_days)
        """), {
            **data.dict(),
            "status": status,
            "taking_leave_days": taking_leave_days,
        })
        # commit() called by context manager

        updated_balance = _get_leave_balance(db, data.employee_id, data.total_leaves)

    return {
        "message": "Leave request submitted",
        "decision": decision,
        "status": status,
        "explanation": explanation,
        **({"rejection_reason": rejection_reason} if rejection_reason else {}),
        "leave_balance": {
            **updated_balance,
            "requested": taking_leave_days,
        },
        "capacity": cap,
    }


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE 4 — AI AUTO-APPROVE
# ═════════════════════════════════════════════════════════════════════════════

@router.post("/ai-approve-leave")
def ai_approve_leave(data: LeaveApprovalRequest,
                     decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED
    with get_db(company_code) as db:
        taking_leave_days = _calc_leave_days(data.start_date, data.end_date)
        balance = _get_leave_balance(db, data.employee_id, data.total_leaves)
        cap = _get_capacity_for_dates(db, data.start_date, data.end_date)

        rejection_reasons = []

        if taking_leave_days > balance["remaining"]:
            rejection_reasons.append(
                f"Insufficient balance: {taking_leave_days} days requested, "
                f"only {balance['remaining']} remaining."
            )

        if cap["critical"]:
            rejection_reasons.append(
                f"Team capacity would drop to {cap['min_capacity_ratio']*100:.0f}%, "
                f"critically below the {CRITICAL_CAPACITY_THRESHOLD*100:.0f}% threshold."
            )

        if rejection_reasons:
            decision = "auto_rejected"
            recommended_status = "Rejected"
            explanation = _ai_explain(
                f"Reject leave for {data.employee_id}. Reasons: {'; '.join(rejection_reasons)}",
                "Rejected: " + " | ".join(rejection_reasons)
            )
        elif cap["sufficient"]:
            decision = "auto_approved"
            recommended_status = "Approved"
            explanation = _ai_explain(
                f"Approve leave for {data.employee_id} ({data.start_date} → {data.end_date}). "
                f"Capacity: {cap['min_capacity_ratio']*100:.0f}%.",
                "Recommended approval — team capacity is sufficient."
            )
        else:
            decision = "escalate_to_manager"
            recommended_status = "Pending"
            explanation = _ai_explain(
                f"Escalate leave for {data.employee_id}. Capacity would fall to "
                f"{cap['min_capacity_ratio']*100:.0f}%.",
                "Escalation recommended — capacity threshold would be breached."
            )

        rejection_reason_str = " | ".join(rejection_reasons) if rejection_reasons else None

    return {
        "employee_id": data.employee_id,
        "leave_dates": f"{data.start_date} → {data.end_date}",
        "taking_leave_days": taking_leave_days,
        "reason": data.reason,
        "decision": decision,
        "recommended_status": recommended_status,
        "rejection_reasons": rejection_reasons,
        "rejection_reason": rejection_reason_str,
        "explanation": explanation,
        "leave_balance": {**balance, "requested": taking_leave_days},
        "capacity_analysis": cap,
    }


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE 5 — LEAVE STATUS
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/leave-status")
def leave_status(decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED
    with get_db(company_code) as db:
        result = db.execute(text("""
            SELECT employee_id, start_date, end_date, reason,
                   status, total_leaves, taking_leave_days
            FROM leaves ORDER BY start_date DESC
        """))
        data = [dict(r._mapping) for r in result]

    return {"data": data}


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE 6 — LEAVE BALANCE
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/leave-balance/{employee_id}")
def get_leave_balance(employee_id: str,
                      decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED
    with get_db(company_code) as db:
        balance = _get_leave_balance(db, employee_id, DEFAULT_TOTAL_LEAVES)

    return balance


# ═════════════════════════════════════════════════════════════════════════════
# ROUTE 7 — AI PATTERN RECOGNITION
# ═════════════════════════════════════════════════════════════════════════════

@router.get("/ai-patterns")
def ai_patterns(decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    today_s = date.today().strftime("%Y-%m-%d")

    # ✅ FIXED — all DB calls inside one 'with' block
    with get_db(company_code) as db:
        min_date_row = db.execute(text("""
            SELECT MIN(date) FROM ai_test_attendance
        """)).scalar()

        if min_date_row:
            data_start = str(min_date_row)
            rolling_cutoff = (date.today() - timedelta(days=30)).strftime("%Y-%m-%d")
            cutoff = min(data_start, rolling_cutoff)
        else:
            cutoff = (date.today() - timedelta(days=30)).strftime("%Y-%m-%d")

        att_rows = db.execute(text("""
            SELECT employee_id, date, status, check_in
            FROM ai_test_attendance
            WHERE date >= :cutoff
            ORDER BY employee_id, date ASC
        """), {"cutoff": cutoff}).fetchall()

        leave_rows = db.execute(text("""
            SELECT employee_id, start_date, end_date, reason, status
            FROM ai_test_leaves
            WHERE start_date >= :cutoff
        """), {"cutoff": cutoff}).fetchall()

    # All DB work done — process data after session closes
    att_by_emp: dict[str, list] = defaultdict(list)
    for r in att_rows:
        att_by_emp[r[0]].append({
            "date": str(r[1]),
            "status": r[2],
            "check_in": r[3] or ""
        })

    leave_by_emp: dict[str, list] = defaultdict(list)
    for r in leave_rows:
        leave_by_emp[r[0]].append({
            "start": str(r[1]),
            "end": str(r[2]),
            "reason": r[3] or "",
            "status": r[4]
        })

    flags: list[dict] = []
    all_emp_ids = set(att_by_emp.keys()) | set(leave_by_emp.keys())

    for emp_id in all_emp_ids:
        issues: list[str] = []
        risk = "low"

        records = att_by_emp[emp_id]
        leaves  = leave_by_emp[emp_id]

        # ── 1. Late arrival streak ────────────────────────────────────────
        consecutive_late = 0
        max_late_streak  = 0
        for rec in records:
            ci = rec["check_in"]
            if ci and rec["status"] == "Present":
                h, m = _parse_hour_minute(ci)
                if h is not None:
                    is_late = (h > LATE_ARRIVAL_HOUR) or (h == LATE_ARRIVAL_HOUR and m > 0)
                    if is_late:
                        consecutive_late += 1
                        max_late_streak = max(max_late_streak, consecutive_late)
                    else:
                        consecutive_late = 0
                else:
                    consecutive_late = 0
            else:
                consecutive_late = 0

        if max_late_streak >= LATE_ARRIVAL_STREAK:
            issues.append(
                f"Chronic late arrivals: {max_late_streak} consecutive days "
                f"checking in after {LATE_ARRIVAL_HOUR}:00"
            )
            risk = "medium"

        # ── 2. Sick-leave spike ───────────────────────────────────────────
        sick_days = sum(
            1 for lv in leaves
            if any(kw in lv["reason"].lower() for kw in SICK_KEYWORDS)
        )
        if sick_days >= SICK_LEAVE_SPIKE_DAYS:
            issues.append(
                f"Sick-leave spike: {sick_days} sick-related leave day(s) "
                "in the last 30 days — possible burnout or health concern"
            )
            risk = "high" if sick_days >= 5 else "medium"

        # ── 3. High absenteeism ───────────────────────────────────────────
        total_days  = len(records) or 1
        absent_days = sum(1 for r in records if r["status"] == "Absent")
        absent_pct  = absent_days / total_days

        if absent_pct > 0.20:
            issues.append(
                f"High absenteeism: absent {absent_days}/{total_days} days "
                f"({absent_pct*100:.0f}%) in the last 30 days"
            )
            risk = "high"

        if not issues:
            continue

        issue_text  = "; ".join(issues)
        explanation = _ai_explain(
            f"Employee {emp_id} attendance issues (last 30 days): {issue_text}. "
            f"Provide a short HR recommendation.",
            f"HR attention recommended for {emp_id}: {issue_text}."
        )

        flags.append({
            "employee_id": emp_id,
            "risk_level": risk,
            "issues": issues,
            "details": {
                "max_late_streak": max_late_streak,
                "sick_days_last_30": sick_days,
                "absent_pct": round(absent_pct * 100, 1),
            },
            "ai_recommendation": explanation,
        })

    risk_order = {"high": 0, "medium": 1, "low": 2}
    flags.sort(key=lambda x: risk_order.get(x["risk_level"], 3))

    summary = {
        "total_employees_scanned": len(all_emp_ids),
        "flagged_count": len(flags),
        "high_risk":   sum(1 for f in flags if f["risk_level"] == "high"),
        "medium_risk": sum(1 for f in flags if f["risk_level"] == "medium"),
    }

    return {
        "analysis_period": f"{cutoff} → {today_s}",
        "summary": summary,
        "flagged_employees": flags,
    }