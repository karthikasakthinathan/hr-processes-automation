from fastapi import APIRouter, Depends, HTTPException
from core.security import verify_firebase_token
from create_tables import create_database, create_tables, migrate_tables
from sqlalchemy import create_engine, text, pool

MYSQL_USER = "root"
MYSQL_PASSWORD = "23Ucs017%40karthika.S"
MYSQL_HOST = "localhost"

router = APIRouter(prefix="/auth", tags=["Authentication"])

_initialized_companies = set()

# ✅ Single shared engine — created ONCE, reused forever
_shared_engine = create_engine(
    f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}",
    pool_size=5,          # max persistent connections in pool
    max_overflow=5,       # extra connections allowed under burst load
    pool_timeout=30,      # wait up to 30s for a free connection
    pool_recycle=1800,    # recycle connections every 30 min (avoids stale)
    pool_pre_ping=True,   # test connection health before using it
)


def company_db_exists(company_code: str) -> bool:
    try:
        # ✅ Reuse the shared engine — no new engine created
        with _shared_engine.connect() as conn:
            result = conn.execute(
                text("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = :db"),
                {"db": company_code}
            )
            return result.fetchone() is not None
    except Exception as e:
        print(f"DB check error: {e}")
        return False


@router.get("/me")
def get_current_user(decoded_token=Depends(verify_firebase_token)):
    return {
        "uid": decoded_token.get("uid"),
        "email": decoded_token.get("email")
    }


@router.post("/login")
def login(decoded_token=Depends(verify_firebase_token)):
    email = decoded_token.get("email")

    if not email:
        raise HTTPException(status_code=400, detail="Email not found in token")

    try:
        domain = email.split("@")[1]
        company_name = domain.split(".")[0]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid email format")

    company_code = f"hrms_{company_name}"

    if company_code not in _initialized_companies:
        if not company_db_exists(company_code):
            create_database(company_code)
            create_tables(company_code)
            print(f"New company setup done: {company_code}")
        else:
            migrate_tables(company_code)
            print(f"Company already exists, migrated: {company_code}")

        _initialized_companies.add(company_code)

    return {
        "status": "login success",
        "company": company_code
    }