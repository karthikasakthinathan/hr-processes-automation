from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager

engines = {}

# MASTER DB
MASTER_DB = "mysql+pymysql://root:23Ucs017%40karthika.S@localhost/hr_master"

master_engine = create_engine(
    MASTER_DB,
    pool_size=5,           # Keep 5 connections ready
    max_overflow=5,        # Allow 5 extra under load (total = 10 max per engine)
    pool_recycle=1800,     # Recycle connections every 30 min (prevents stale conn errors)
    pool_pre_ping=True,    # Test connection health before using it
    pool_timeout=30,       # Wait max 30s for a connection before raising error
)
MasterSession = sessionmaker(bind=master_engine)


# -------------------------------
# CREATE COMPANY DATABASE
# -------------------------------
def create_company_database(company_code: str):
    with MasterSession() as db:
        db.execute(text(f"CREATE DATABASE IF NOT EXISTS {company_code}"))
        db.commit()


# -------------------------------
# GET DATABASE URL
# -------------------------------
def get_database_url(company_code: str):
    return f"mysql+pymysql://root:23Ucs017%40karthika.S@localhost/{company_code}"


# -------------------------------
# GET OR CREATE ENGINE
# -------------------------------
def get_engine(company_code: str):
    if company_code not in engines:
        DATABASE_URL = get_database_url(company_code)
        engines[company_code] = create_engine(
            DATABASE_URL,
            pool_size=5,         # Reduced from 10 — plenty for a demo/viva
            max_overflow=5,      # Reduced from 20
            pool_recycle=1800,   # Recycle stale connections
            pool_pre_ping=True,  # Auto-reconnect on dropped connections
            pool_timeout=30,
        )
    return engines[company_code]


# -------------------------------
# SESSION FACTORY (use this in routes via Depends)
# -------------------------------
def get_session_factory(company_code: str):
    return sessionmaker(bind=get_engine(company_code))


# -------------------------------
# CONTEXT MANAGER — use in routes directly
# Usage:
#   with get_db(company_code) as db:
#       db.execute(...)
# -------------------------------
@contextmanager
def get_db(company_code: str):
    SessionLocal = get_session_factory(company_code)
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()  # ← This is what was missing. Always runs, even on error.


# -------------------------------
# FASTAPI DEPENDENCY (alternative to context manager)
# Usage in routes:
#   def my_route(db=Depends(get_db_dependency("company1"))):
# -------------------------------
def get_db_dependency(company_code: str):
    def _get_db():
        SessionLocal = get_session_factory(company_code)
        db = SessionLocal()
        try:
            yield db
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
    return _get_db