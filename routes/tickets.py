from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from core.security import verify_firebase_token
from core.tenant import get_company_from_token
from database import get_db
from sqlalchemy import text
import os
import shutil

router = APIRouter(prefix="/tickets", tags=["HR Tickets"])


@router.post("/create")
def create_ticket(
    subject: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(None),
    decoded_token=Depends(verify_firebase_token)
):
    try:
        company_code = get_company_from_token(decoded_token)
        employee_id = decoded_token.get("employee_id") or decoded_token.get("uid")

        # ✅ FIXED
        with get_db(company_code) as db:
            db.execute(
                text("""
                INSERT INTO hr_tickets (employee_id, subject, category, description, status)
                VALUES (:employee_id, :subject, :category, :description, 'Open')
                """),
                {
                    "employee_id": employee_id,
                    "subject": subject,
                    "category": category,
                    "description": description,
                }
            )
            # commit() called automatically

        return {"success": True, "message": "Ticket Created Successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recent")
def get_recent_tickets(decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED
    with get_db(company_code) as db:
        result = db.execute(text("""
            SELECT id, employee_id, subject, category, status
            FROM hr_tickets
            ORDER BY id DESC
            LIMIT 10
        """)).mappings().all()
        tickets = [
            {
                "id": row["id"],
                "emp_id": row["employee_id"],
                "issue": row["subject"],
                "category": row["category"],
                "status": row["status"]
            }
            for row in result
        ]

    return {"data": tickets}


@router.get("/all")
def get_all_tickets(decoded_token=Depends(verify_firebase_token)):
    try:
        company_code = get_company_from_token(decoded_token)

        # ✅ FIXED
        with get_db(company_code) as db:
            result = db.execute(text("""
                SELECT id, employee_id, subject, category, description, status
                FROM hr_tickets
                ORDER BY id DESC
            """)).mappings().all()
            data = [dict(r) for r in result]

        return {"success": True, "data": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/update-status/{ticket_id}")
def update_ticket_status(
    ticket_id: int,
    status: str,
    decoded_token=Depends(verify_firebase_token)
):
    try:
        company_code = get_company_from_token(decoded_token)

        # ✅ FIXED
        with get_db(company_code) as db:
            db.execute(
                text("UPDATE hr_tickets SET status = :status WHERE id = :ticket_id"),
                {"status": status, "ticket_id": ticket_id}
            )
            # commit() called automatically

        return {"success": True, "message": "Ticket Status Updated"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))