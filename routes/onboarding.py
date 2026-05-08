from fastapi import APIRouter, Depends, UploadFile, File
from pydantic import BaseModel
from core.security import verify_firebase_token
from core.tenant import get_company_from_token
from database import get_db
from sqlalchemy import text
import uuid
import pandas as pd
from services.bulk_upload_service import process_excel_upload

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


# -------------------------------
# SCHEMA
# -------------------------------

class EmployeeCreate(BaseModel):
    name: str
    job_title: str
    email: str
    location: str


# -------------------------------
# GET EMPLOYEES
# -------------------------------

@router.get("/employees")
def get_employees(decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED
    with get_db(company_code) as db:
        result = db.execute(text("SELECT * FROM employees"))
        employees = [dict(row) for row in result]

    return {"data": employees}


# -------------------------------
# ADD EMPLOYEE (ONBOARDING)
# -------------------------------

@router.post("/add-employee")
def add_employee(emp: EmployeeCreate, decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)
    employee_id = str(uuid.uuid4())[:8]

    # ✅ FIXED — context manager handles commit/rollback/close automatically
    try:
        with get_db(company_code) as db:
            db.execute(text("""
                INSERT INTO employee_master
                (employee_id, full_name, email, phone, department, designation)
                VALUES (:employee_id, :name, :email, '9000000000', 'IT', :job_title)
            """), {
                "employee_id": employee_id,
                "name": emp.name,
                "job_title": emp.job_title,
                "email": emp.email
            })
            db.execute(text("""
                INSERT INTO onboarding
                (employee_id, offer_date, joining_date, documents, training_status, onboarding_status)
                VALUES (:employee_id, CURRENT_DATE, CURRENT_DATE, 'No', 'Not Started', 'Pending')
            """), {"employee_id": employee_id})
            # commit() called automatically by context manager on success
            # rollback() called automatically on exception

        return {"message": "Employee Added", "employee_id": employee_id}

    except Exception as e:
        return {"error": str(e)}


# -------------------------------
# GET ONBOARDING LIST
# -------------------------------

@router.get("/get-onboarding-list")
def get_onboarding_list(decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED
    with get_db(company_code) as db:
        query = text("""
            SELECT 
                employee_id,
                joining_date,
                onboarding_status,
                training_status,
                documents
            FROM onboarding
            ORDER BY joining_date DESC
        """)
        result = db.execute(query)
        data = [
            {
                "id": row["employee_id"],
                "joining_date": str(row["joining_date"]),
                "status": row["onboarding_status"],
                "training": row["training_status"],
                "docs": row["documents"]
            }
            for row in result.mappings()
        ]

    return {"data": data}


# =====================================================
# ⭐⭐⭐⭐⭐ BULK EXCEL UPLOAD (MASTER FEATURE) ⭐⭐⭐⭐⭐
# =====================================================

@router.post("/bulk-upload")
def bulk_upload_excel(
    file: UploadFile = File(...),
    decoded_token=Depends(verify_firebase_token)
):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED
    try:
        with get_db(company_code) as db:
            xls = pd.ExcelFile(file.file)
            sheets = {}
            for sheet in xls.sheet_names:
                sheets[sheet] = pd.read_excel(xls, sheet)

            print("📋 Sheet names found in Excel:", list(sheets.keys()))

            result = process_excel_upload(db, sheets)
            # commit() called automatically by context manager on success

        return result

    except Exception as e:
        return {"error": str(e)}