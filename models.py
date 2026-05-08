from sqlalchemy import Column, String, Date
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Employee(Base):
    __tablename__ = "employee_master"

    employee_id = Column(String(10), primary_key=True)
    full_name = Column(String(50))
    email = Column(String(50))
    department = Column(String(30))
    designation = Column(String(30))
    status = Column(String(20))