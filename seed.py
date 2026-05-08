from database import get_db
from sqlalchemy import text

# -------------------------------
# SAMPLE DATA
# -------------------------------

jobs = [
    {
        "title": "Software Engineer",
        "location": "Chennai",
        "description": "Python Developer"
    },
    {
        "title": "HR Executive",
        "location": "Bangalore",
        "description": "Handle HR operations"
    }
]

employees = [
    {
        "employee_id": "EMP001",
        "name": "Karthi",
        "job_title": "Backend Developer",
        "email": "karthi@example.com",
        "location": "Chennai",
        "status": "Active"
    },
    {
        "employee_id": "EMP002",
        "name": "Rahul",
        "job_title": "HR Manager",
        "email": "rahul@example.com",
        "location": "Bangalore",
        "status": "Active"
    }
]


# -------------------------------
# SELECT COMPANY DATABASE
# -------------------------------

company_code = "hrms_company_a"

db = get_db(company_code)


# -------------------------------
# INSERT JOBS
# -------------------------------

for job in jobs:

    db.execute(
        text("""
        INSERT INTO recruitment_jobs
        (title, location, description)
        VALUES (:title, :location, :description)
        """),
        job
    )


# -------------------------------
# INSERT EMPLOYEES
# -------------------------------

for emp in employees:

    db.execute(
        text("""
        INSERT INTO employees
        (employee_id, name, job_title, email, location, status)
        VALUES (:employee_id, :name, :job_title, :email, :location, :status)
        """),
        emp
    )


db.commit()

print("Sample data inserted successfully")