from fastapi import APIRouter
from firebase_admin import auth
from sqlalchemy import text

from create_tables import create_database, create_tables
from database import MasterSession

router = APIRouter(prefix="/register", tags=["Register"])


@router.post("/company")
def register_company(company_name: str, email: str, password: str):

    db_master = MasterSession()

    try:
        # ⭐ company code generate
        company_code = f"hrms_{company_name.lower()}"

        # ⭐ firebase user create
        user = auth.create_user(
            email=email,
            password=password
        )

        # ⭐ set custom claim
        auth.set_custom_user_claims(user.uid, {
            "companyCode": company_code
        })

        # ⭐ create database + tables
        create_database(company_code)
        create_tables(company_code)

        # ⭐ automation mapping
        db_master.execute(text("""
            INSERT INTO companies (email, company_code)
            VALUES (:email, :company_code)
        """), {
            "email": email,
            "company_code": company_code
        })

        db_master.commit()

        return {
            "status": "Company created",
            "companyCode": company_code
        }

    except Exception as e:
        db_master.rollback()
        return {"error": str(e)}

    finally:
        db_master.close()