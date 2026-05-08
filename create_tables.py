from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

MYSQL_USER = "root"
MYSQL_PASSWORD = "23Ucs017%40karthika.S"
MYSQL_HOST = "localhost"

# ───────────────────────────────────────────────────────────────────────────────
# HELPER — builds a one-shot engine that closes connections immediately
# NullPool = no connection pool, every connection is opened and closed cleanly
# ───────────────────────────────────────────────────────────────────────────────

def _make_engine(db_name: str = ""):
    url = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}"
    if db_name:
        url += f"/{db_name}"
    return create_engine(url, poolclass=NullPool)


# ───────────────────────────────────────────────────────────────────────────────
# CREATE DATABASE
# ───────────────────────────────────────────────────────────────────────────────

def create_database(company_code):
    engine = _make_engine()          # no db selected yet
    try:
        with engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{company_code}`"))
            conn.commit()
        print(f"Database created: {company_code}")
    finally:
        engine.dispose()             # ✅ always release the connection


# ───────────────────────────────────────────────────────────────────────────────
# CREATE TABLES  (new companies get all columns from the start)
# ───────────────────────────────────────────────────────────────────────────────

def create_tables(company_code):
    engine = _make_engine(company_code)
    try:
        with engine.connect() as conn:

            # Recruitment Jobs
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS recruitment_jobs (
                id               INT AUTO_INCREMENT PRIMARY KEY,
                title            VARCHAR(255),
                location         VARCHAR(255),
                description      TEXT,
                required_skills  JSON,
                status           VARCHAR(50) DEFAULT 'Open',
                posted_date      DATE DEFAULT NULL,
                department       VARCHAR(255) DEFAULT NULL
            )
            """))

            # Recruitment Candidates
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS recruitment_candidates (
                id               INT AUTO_INCREMENT PRIMARY KEY,
                job_id           INT DEFAULT NULL,
                name             VARCHAR(255),
                email            VARCHAR(255),
                skills           JSON,
                experience_years TINYINT UNSIGNED DEFAULT 0,
                match_score      DECIMAL(5,2) DEFAULT 0.00,
                matched_skills   JSON,
                missing_skills   JSON,
                status           ENUM('Highly Shortlisted','Shortlisted','Rejected') DEFAULT 'Rejected',
                `rank`           SMALLINT UNSIGNED,
                UNIQUE KEY uq_job_candidate (job_id, email)
            )
            """))

            # Employees
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS employees (
                id           INT AUTO_INCREMENT PRIMARY KEY,
                employee_id  VARCHAR(50),
                name         VARCHAR(255),
                job_title    VARCHAR(255),
                email        VARCHAR(255),
                location     VARCHAR(255),
                department   VARCHAR(255) DEFAULT NULL,
                phone        VARCHAR(50)  DEFAULT NULL,
                joining_date DATE         DEFAULT NULL,
                status       VARCHAR(50)
            )
            """))

            # Onboarding
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS onboarding (
                id                INT AUTO_INCREMENT PRIMARY KEY,
                employee_id       VARCHAR(50),
                name              VARCHAR(255),
                email             VARCHAR(255),
                job_title         VARCHAR(255),
                department        VARCHAR(255),
                joining_date      DATE,
                offer_date        DATE         DEFAULT NULL,
                status            VARCHAR(50),
                onboarding_status VARCHAR(50)  DEFAULT 'Pending',
                training_status   VARCHAR(50)  DEFAULT 'Not Started',
                documents         VARCHAR(50)  DEFAULT 'No'
            )
            """))

            # Attendance
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS attendance (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                employee_id   VARCHAR(50),
                date          VARCHAR(50),
                status        VARCHAR(50),
                check_in      VARCHAR(20)    DEFAULT NULL,
                check_out     TIME           DEFAULT NULL,
                working_hours DECIMAL(5,2)  DEFAULT NULL
            )
            """))

            # Leaves
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS leaves (
                id                INT AUTO_INCREMENT PRIMARY KEY,
                employee_id       VARCHAR(50),
                start_date        VARCHAR(50),
                end_date          VARCHAR(50),
                reason            TEXT,
                status            VARCHAR(50),
                leave_type        VARCHAR(50)  DEFAULT NULL,
                approved_by       VARCHAR(100) DEFAULT NULL,
                total_leaves      INT          DEFAULT 20,
                taking_leave_days INT          DEFAULT 0
            )
            """))

            # Payroll
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS payroll (
                id             INT AUTO_INCREMENT PRIMARY KEY,
                employee_id    VARCHAR(50),
                month          VARCHAR(50),
                basic_salary   DECIMAL(10,2),
                deductions     DECIMAL(10,2),
                allowances     DECIMAL(10,2) DEFAULT 0.00,
                net_salary     DECIMAL(10,2),
                payment_status VARCHAR(50)   DEFAULT 'Pending',
                payment_date   DATE          DEFAULT NULL
            )
            """))

            # HR Tickets
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS hr_tickets (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                employee_id   VARCHAR(50)  DEFAULT NULL,
                subject       VARCHAR(255),
                category      VARCHAR(255),
                description   TEXT,
                status        VARCHAR(50),
                created_date  DATE         DEFAULT NULL,
                resolved_date DATE         DEFAULT NULL
            )
            """))

            # Exit Management
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS exit_requests (
                id                 INT AUTO_INCREMENT PRIMARY KEY,
                employee_id        VARCHAR(50)  NOT NULL,
                firebase_uid       VARCHAR(255) DEFAULT NULL,
                reason             VARCHAR(255) DEFAULT NULL,
                notice_period_days INT          DEFAULT 60,
                start_date         DATE         DEFAULT NULL,
                last_working_date  DATE         DEFAULT NULL,
                status             VARCHAR(50)  DEFAULT 'Notice Period'
            )
            """))

            # AI Test Attendance
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ai_test_attendance (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                employee_id   VARCHAR(50),
                date          VARCHAR(50),
                status        VARCHAR(50),
                check_in      VARCHAR(20)   DEFAULT NULL,
                check_out     TIME          DEFAULT NULL,
                working_hours DECIMAL(5,2) DEFAULT NULL,
                late_flag     VARCHAR(10)  DEFAULT 'No',
                overtime_hours DECIMAL(5,2) DEFAULT 0.00
            )
            """))

            # AI Test Leaves
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ai_test_leaves (
                id                INT AUTO_INCREMENT PRIMARY KEY,
                employee_id       VARCHAR(50),
                start_date        VARCHAR(50),
                end_date          VARCHAR(50),
                reason            TEXT,
                status            VARCHAR(50),
                total_leaves      INT          DEFAULT 10,
                taking_leave_days INT          DEFAULT 0,
                leave_type        VARCHAR(50)  DEFAULT NULL,
                approved_by       VARCHAR(100) DEFAULT NULL,
                applied_on        DATE         DEFAULT NULL,
                leave_balance     INT          DEFAULT 10
            )
            """))

            conn.commit()

        print(f"All tables created for {company_code}")
    finally:
        engine.dispose()             # ✅ always release the connection


# ───────────────────────────────────────────────────────────────────────────────
# MIGRATE TABLES  (safe / idempotent — run on existing companies)
# ───────────────────────────────────────────────────────────────────────────────

def migrate_tables(company_code):
    engine = _make_engine(company_code)

    migrations = [
        # Onboarding
        "ALTER TABLE onboarding ADD COLUMN offer_date DATE DEFAULT NULL",
        "ALTER TABLE onboarding ADD COLUMN onboarding_status VARCHAR(50) DEFAULT 'Pending'",
        "ALTER TABLE onboarding ADD COLUMN training_status VARCHAR(50) DEFAULT 'Not Started'",
        "ALTER TABLE onboarding ADD COLUMN documents VARCHAR(50) DEFAULT 'No'",

        # Employees
        "ALTER TABLE employees ADD COLUMN department VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE employees ADD COLUMN phone VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE employees ADD COLUMN joining_date DATE DEFAULT NULL",

        # Attendance
        "ALTER TABLE attendance ADD COLUMN check_in VARCHAR(20) DEFAULT NULL",
        "ALTER TABLE attendance ADD COLUMN check_out TIME DEFAULT NULL",
        "ALTER TABLE attendance ADD COLUMN working_hours DECIMAL(5,2) DEFAULT NULL",

        # Leaves
        "ALTER TABLE leaves ADD COLUMN leave_type VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE leaves ADD COLUMN approved_by VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE leaves ADD COLUMN total_leaves INT DEFAULT 20",
        "ALTER TABLE leaves ADD COLUMN taking_leave_days INT DEFAULT 0",

        # Payroll
        "ALTER TABLE payroll ADD COLUMN allowances DECIMAL(10,2) DEFAULT 0.00",
        "ALTER TABLE payroll ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Pending'",
        "ALTER TABLE payroll ADD COLUMN payment_date DATE DEFAULT NULL",

        # HR Tickets
        "ALTER TABLE hr_tickets ADD COLUMN employee_id VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE hr_tickets ADD COLUMN created_date DATE DEFAULT NULL",
        "ALTER TABLE hr_tickets ADD COLUMN resolved_date DATE DEFAULT NULL",

        # Exit requests
        "ALTER TABLE exit_requests MODIFY COLUMN firebase_uid VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE exit_requests MODIFY COLUMN reason VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE exit_requests ADD COLUMN start_date DATE DEFAULT NULL",
        "ALTER TABLE exit_requests MODIFY COLUMN last_working_date DATE DEFAULT NULL",

        # Recruitment Jobs
        "ALTER TABLE recruitment_jobs ADD COLUMN required_skills JSON DEFAULT NULL",
        "ALTER TABLE recruitment_jobs ADD COLUMN status VARCHAR(50) DEFAULT 'Open'",
        "ALTER TABLE recruitment_jobs ADD COLUMN posted_date DATE DEFAULT NULL",
        "ALTER TABLE recruitment_jobs ADD COLUMN department VARCHAR(255) DEFAULT NULL",

        # Recruitment Candidates
        "ALTER TABLE recruitment_candidates ADD COLUMN job_id INT DEFAULT NULL",
        "ALTER TABLE recruitment_candidates ADD COLUMN email VARCHAR(255) DEFAULT NULL",
        "ALTER TABLE recruitment_candidates ADD COLUMN experience_years TINYINT UNSIGNED DEFAULT 0",
        "ALTER TABLE recruitment_candidates ADD COLUMN match_score DECIMAL(5,2) DEFAULT 0.00",
        "ALTER TABLE recruitment_candidates ADD COLUMN matched_skills JSON DEFAULT NULL",
        "ALTER TABLE recruitment_candidates ADD COLUMN missing_skills JSON DEFAULT NULL",
        "ALTER TABLE recruitment_candidates ADD COLUMN `rank` SMALLINT UNSIGNED DEFAULT NULL",

        # AI Test Attendance
        "ALTER TABLE ai_test_attendance ADD COLUMN check_out TIME DEFAULT NULL",
        "ALTER TABLE ai_test_attendance ADD COLUMN working_hours DECIMAL(5,2) DEFAULT NULL",
        "ALTER TABLE ai_test_attendance ADD COLUMN late_flag VARCHAR(10) DEFAULT 'No'",
        "ALTER TABLE ai_test_attendance ADD COLUMN overtime_hours DECIMAL(5,2) DEFAULT 0.00",

        # AI Test Leaves
        "ALTER TABLE ai_test_leaves ADD COLUMN leave_type VARCHAR(50) DEFAULT NULL",
        "ALTER TABLE ai_test_leaves ADD COLUMN approved_by VARCHAR(100) DEFAULT NULL",
        "ALTER TABLE ai_test_leaves ADD COLUMN applied_on DATE DEFAULT NULL",
        "ALTER TABLE ai_test_leaves ADD COLUMN leave_balance INT DEFAULT 10",
    ]

    try:
        with engine.connect() as conn:
            for sql in migrations:
                try:
                    conn.execute(text(sql))
                    conn.commit()
                except Exception as e:
                    if "Duplicate column name" in str(e):
                        pass  # already exists, skip silently
                    else:
                        print(f"Migration error: {e}")

        print(f"Migration done: {company_code}")
    finally:
        engine.dispose()             # ✅ always release the connection


# ───────────────────────────────────────────────────────────────────────────────
# FIX EXISTING COMPANY
# ───────────────────────────────────────────────────────────────────────────────

def fix_existing_company(company_code):
    engine = _make_engine(company_code)

    fixes = [
        "ALTER TABLE leaves ADD COLUMN total_leaves INT DEFAULT 20",
        "ALTER TABLE leaves ADD COLUMN taking_leave_days INT DEFAULT 0",
        "ALTER TABLE attendance ADD COLUMN check_in VARCHAR(20) DEFAULT NULL",
        "ALTER TABLE attendance ADD COLUMN check_out TIME DEFAULT NULL",
        "ALTER TABLE attendance ADD COLUMN working_hours DECIMAL(5,2) DEFAULT NULL",
    ]

    try:
        with engine.connect() as conn:
            for sql in fixes:
                try:
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"✅ Applied  : {sql}")
                except Exception as e:
                    if "Duplicate column name" in str(e):
                        print(f"⏭️  Skipped  : column already exists")
                    else:
                        print(f"❌ Error    : {e}")

        print(f"\n✅ fix_existing_company done: {company_code}")
    finally:
        engine.dispose()             # ✅ always release the connection


# ───────────────────────────────────────────────────────────────────────────────
# COMPANY CREATION
# ───────────────────────────────────────────────────────────────────────────────

def create_company(company_name):
    company_code = f"hrms_{company_name.lower()}"
    create_database(company_code)
    create_tables(company_code)
    return company_code


# ───────────────────────────────────────────────────────────────────────────────
# RUN FILE
# ───────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":

    print("\n══════════════════════════════════════")
    print("       HRMS Database Setup Tool       ")
    print("══════════════════════════════════════")
    print("1. Create new company")
    print("2. Migrate existing company (all columns)")
    print("3. Fix existing company    (leave columns only)")
    print("══════════════════════════════════════")
    choice = input("Choice (1 / 2 / 3): ").strip()

    if choice == "1":
        company_name = input("Enter company name: ").strip()
        company_code = create_company(company_name)
        print(f"\n✅ Company setup completed: {company_code}")

    elif choice == "2":
        company_code = input("Enter company code (e.g. hrms_demo): ").strip()
        migrate_tables(company_code)

    elif choice == "3":
        company_code = input("Enter company code (e.g. hrms_company19): ").strip()
        fix_existing_company(company_code)

    else:
        print("❌ Invalid choice")