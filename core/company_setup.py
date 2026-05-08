from sqlalchemy import create_engine, text
from create_tables import create_tables

MYSQL_URL = "mysql+pymysql://root:23Ucs017%40karthika.S@localhost/"

def setup_company_database(company_code: str):

    engine = create_engine(MYSQL_URL)

    # ⭐ First check & create database
    with engine.connect() as conn:

        result = conn.execute(
            text("SHOW DATABASES LIKE :db"),
            {"db": company_code}
        ).fetchone()

        if not result:
            conn.execute(text(f"CREATE DATABASE {company_code}"))
            conn.commit()

            print("✅ Database Created:", company_code)

    # ⭐ VERY IMPORTANT
    # DB create ஆன பிறகு connection close ஆகும்
    # இப்போ tables create பண்ணும்
    create_tables(company_code)

    print("✅ Tables Created:", company_code)