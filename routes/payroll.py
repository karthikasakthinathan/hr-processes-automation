from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from core.security import verify_firebase_token
from core.tenant import get_company_from_token
from database import get_db
from sqlalchemy import text
from fpdf import FPDF
import zipfile
import os

router = APIRouter(prefix="/payroll", tags=["Payroll"])


# -------------------------------
# SCHEMA
# -------------------------------

class PayrollCreate(BaseModel):
    employee_id: str
    month: str
    basic_salary: float
    deductions: float


# -------------------------------
# GET PAYROLL LIST
# -------------------------------

@router.get("/records")
def get_payroll(decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED
    with get_db(company_code) as db:
        query = text("""
            SELECT 
                p.employee_id,
                p.month,
                p.basic_salary,
                p.deductions,
                p.net_salary,
                (
                    SELECT joining_date
                    FROM onboarding
                    WHERE employee_id = p.employee_id
                    LIMIT 1
                ) AS joining_date
            FROM payroll p
            ORDER BY p.id DESC
        """)
        result = db.execute(query).mappings().all()
        data = [dict(row) for row in result]

    return {"data": data}


# -------------------------------
# GENERATE PAYROLL
# -------------------------------

@router.post("/generate")
def generate_payroll(data: PayrollCreate, decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED
    with get_db(company_code) as db:
        existing = db.execute(
            text("SELECT * FROM payroll WHERE employee_id=:e AND month=:m"),
            {"e": data.employee_id, "m": data.month}
        ).fetchone()

        if existing:
            return {"message": "Payroll already generated"}

        net_salary = data.basic_salary - data.deductions

        db.execute(
            text("""
            INSERT INTO payroll
            (employee_id, month, basic_salary, deductions, net_salary)
            VALUES (:employee_id, :month, :basic_salary, :deductions, :net_salary)
            """),
            {
                "employee_id": data.employee_id,
                "month": data.month,
                "basic_salary": data.basic_salary,
                "deductions": data.deductions,
                "net_salary": net_salary
            }
        )
        # commit() called automatically by context manager

    return {
        "message": "Payroll generated successfully",
        "net_salary": net_salary
    }


# -------------------------------
# DOWNLOAD SINGLE PAYSLIP
# -------------------------------

@router.get("/download-payslip")
def download_payslip(
    month: str,
    employee_id: str,
    decoded_token=Depends(verify_firebase_token)
):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED
    try:
        with get_db(company_code) as db:
            row = db.execute(
                text("SELECT * FROM payroll WHERE month LIKE :m AND employee_id=:e"),
                {"m": f"%{month.split()[0]}%", "e": employee_id}
            ).mappings().first()
            row = dict(row) if row else None  # read data before session closes

        if not row:
            return {"error": f"No payroll data found for {month}"}

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("helvetica", "B", 18)
        pdf.cell(0, 12, "PAYSLIP", ln=True, align="C")
        pdf.ln(5)

        pdf.set_font("helvetica", size=12)
        pdf.cell(0, 8, f"Employee ID : {row['employee_id']}", ln=True)
        pdf.cell(0, 8, f"Month : {row['month']}", ln=True)
        pdf.ln(5)

        pdf.set_font("helvetica", "B", 12)
        pdf.cell(80, 10, "Description", border=1)
        pdf.cell(80, 10, "Amount", border=1, ln=True)

        pdf.set_font("helvetica", size=12)
        pdf.cell(80, 10, "Basic Salary", border=1)
        pdf.cell(80, 10, f"Rs. {row['basic_salary']}", border=1, ln=True)

        pdf.cell(80, 10, "Deductions", border=1)
        pdf.cell(80, 10, f"Rs. {row['deductions']}", border=1, ln=True)

        pdf.cell(80, 10, "Net Salary", border=1)
        pdf.cell(80, 10, f"Rs. {row['net_salary']}", border=1, ln=True)

        pdf_output = pdf.output(dest="S")
        if isinstance(pdf_output, str):
            pdf_output = pdf_output.encode("latin-1")

        return Response(
            content=pdf_output,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=payslip_{employee_id}_{month}.pdf",
                "Content-Length": str(len(pdf_output)),
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except Exception as e:
        print(f"PDF Error: {str(e)}")
        return {"error": str(e)}


# -------------------------------
# DOWNLOAD ALL PAYSLIPS
# -------------------------------

@router.get("/download-all-payslips")
def download_all_payslips(
    month: str,
    decoded_token=Depends(verify_firebase_token)
):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED — read rows first, then close session, then build PDFs
    with get_db(company_code) as db:
        rows = db.execute(text("SELECT * FROM payroll")).mappings().all()
        rows = [dict(r) for r in rows]  # materialize before session closes

    if not rows:
        return {"error": "No records"}

    zip_path = f"all_payslips_{month}.zip"

    with zipfile.ZipFile(zip_path, "w") as zipf:
        for row in rows:
            pdf_name = f"payslip_{row['employee_id']}.pdf"
            pdf = FPDF()
            pdf.add_page()

            pdf.set_font("helvetica", "B", 18)
            pdf.cell(0, 12, "PAYSLIP", ln=True, align="C")
            pdf.ln(5)

            pdf.set_font("helvetica", size=12)
            pdf.cell(0, 8, f"Employee ID : {row['employee_id']}", ln=True)
            pdf.cell(0, 8, f"Month : {row['month']}", ln=True)
            pdf.ln(8)

            pdf.set_font("helvetica", "B", 12)
            pdf.cell(95, 10, "Description", border=1, align="C")
            pdf.cell(95, 10, "Amount", border=1, ln=True, align="C")

            pdf.set_font("helvetica", size=12)
            pdf.cell(95, 10, "Net Salary", border=1)
            pdf.cell(95, 10, f"Rs. {row['net_salary']}", border=1, ln=True)

            pdf.cell(95, 10, "Status", border=1)
            pdf.cell(95, 10, "Paid", border=1, ln=True)

            pdf.output(pdf_name)
            zipf.write(pdf_name)
            os.remove(pdf_name)

    return FileResponse(zip_path, filename=zip_path)


# -------------------------------
# GET RECENT PAYSLIPS
# -------------------------------

@router.get("/recent-payslips")
def get_recent_payslips(decoded_token=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded_token)

    # ✅ FIXED
    with get_db(company_code) as db:
        query = text("""
            SELECT employee_id, month, net_salary
            FROM payroll
            ORDER BY id DESC
            LIMIT 5
        """)
        result = db.execute(query).mappings().all()
        response = [
            {
                "employee_id": row["employee_id"],
                "month": row["month"],
                "net_salary": row["net_salary"],
                "status": "Paid" if row["net_salary"] > 0 else "Unpaid"
            }
            for row in result
        ]

    return {"data": response}