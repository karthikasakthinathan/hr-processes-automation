from pydantic import BaseModel
from typing import List

# -------------------------------
# RECRUITMENT
# -------------------------------

class JobCreate(BaseModel):
    title: str
    location: str
    description: str


class CandidateCreate(BaseModel):
    name: str
    skills: str
    joining_date: str
    status: str


# -------------------------------
# ONBOARDING
# -------------------------------

class EmployeeCreate(BaseModel):
    name: str
    job_title: str
    email: str
    location: str


# -------------------------------
# ATTENDANCE
# -------------------------------

class AttendanceCreate(BaseModel):
    employee_id: str
    date: str
    status: str


class LeaveCreate(BaseModel):
    employee_id: str
    start_date: str
    end_date: str
    reason: str


# -------------------------------
# PAYROLL
# -------------------------------

class PayrollCreate(BaseModel):
    employee_id: str
    month: str
    basic_salary: float
    deductions: float


# -------------------------------
# HR TICKETS
# -------------------------------

class TicketCreate(BaseModel):
    subject: str
    category: str
    description: str


# -------------------------------
# EXIT MANAGEMENT
# -------------------------------

class ExitRequest(BaseModel):
    employee_id: str
    reason: str
    last_working_date: str

# -------------------------------
# BULK UPLOAD
# -------------------------------

class SheetResult(BaseModel):
    sheet: str
    table: str
    rows_inserted: int
    rows_skipped: int
    errors: List[str] = []

class BulkUploadResponse(BaseModel):
    success: bool
    message: str
    total_inserted: int
    total_skipped: int
    sheets_processed: int
    sheets_skipped: List[str] = []
    results: List[SheetResult] = []