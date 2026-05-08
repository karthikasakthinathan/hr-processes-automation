from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes import recruitment
from routes import onboarding
from routes import attendance
from routes import payroll
from routes import tickets
from routes import exit
from routes import auth
from routes import register

app = FastAPI(title="HR Processes Automation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTES
app.include_router(recruitment.router)
app.include_router(onboarding.router)
app.include_router(attendance.router)
app.include_router(payroll.router)
app.include_router(tickets.router)
app.include_router(exit.router)
app.include_router(auth.router)
app.include_router(register.router)

@app.get("/")
def root():
    return {"message": "Backend Running"}