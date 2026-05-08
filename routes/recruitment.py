from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile
from pydantic import BaseModel, field_validator
from typing import List, Optional
from core.security import verify_firebase_token
from core.tenant import get_company_from_token
from database import get_db
from sqlalchemy import text
import json
import io
import pdfplumber
from groq import Groq
import os

router = APIRouter(prefix="/recruitment", tags=["Recruitment"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

# ─────────────────────────── Helpers ───────────────────────────

def safe_json(val):
    if not val or str(val).strip() == "":
        return []
    try:
        return json.loads(val)
    except:
        return []


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        print(f"[ERROR] PDF text extraction failed: {str(e)}")
        return ""


# ─────────────────────────── Schemas ───────────────────────────

class JobCreate(BaseModel):
    title: str
    location: str
    description: str
    required_skills: List[str]

    @field_validator("required_skills", mode="before")
    @classmethod
    def parse_skills(cls, v):
        if isinstance(v, str):
            return [s.strip().lower() for s in v.split(",") if s.strip()]
        if isinstance(v, list):
            return [s.strip().lower() for s in v]
        raise ValueError("required_skills must be a list or comma-separated string")


class CandidateProfile(BaseModel):
    name: str
    email: str
    skills: List[str]
    experience_years: Optional[int] = 0

    @field_validator("skills", mode="before")
    @classmethod
    def parse_skills(cls, v):
        if isinstance(v, str):
            return [s.strip().lower() for s in v.split(",") if s.strip()]
        if isinstance(v, list):
            return [s.strip().lower() for s in v]
        raise ValueError("skills must be a list or comma-separated string")


class BulkCandidateRequest(BaseModel):
    job_id: int
    candidates: List[CandidateProfile]


# ─────────────────────────── Scoring ───────────────────────────

def calculate_match_score(candidate_skills: List[str], required_skills: List[str]) -> dict:
    candidate_set = {s.lower().strip() for s in candidate_skills}
    required_set = {s.lower().strip() for s in required_skills}
    matched = candidate_set & required_set
    missing = required_set - candidate_set
    if not required_set:
        return {"score": 0.0, "matched": [], "missing": []}
    score = round((len(matched) / len(required_set)) * 100, 2)
    return {"score": score, "matched": sorted(matched), "missing": sorted(missing)}


def determine_status(score: float) -> str:
    if score >= 80:
        return "Highly Shortlisted"
    elif score >= 60:
        return "Shortlisted"
    else:
        return "Rejected"


def rank_candidates(evaluated: List[dict]) -> List[dict]:
    ranked = sorted(evaluated, key=lambda x: x["score"], reverse=True)
    for i, c in enumerate(ranked, start=1):
        c["rank"] = i
    return ranked


# ─────────────────────────── Endpoints ───────────────────────────

@router.post("/parse-resume", summary="Extract candidate info from PDF resume using AI")
async def parse_resume(
    file: UploadFile = FastAPIFile(...),
    decoded=Depends(verify_firebase_token)
):
    try:
        pdf_bytes = await file.read()
        if not pdf_bytes or len(pdf_bytes) == 0:
            return {"success": False, "error": "Uploaded file is empty"}

        pdf_text = extract_text_from_pdf(pdf_bytes)
        if not pdf_text:
            return {"success": False, "error": "Could not extract text from PDF. File may be scanned or corrupted."}

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a resume parser. Extract information from resumes and return ONLY valid JSON with no markdown or explanation."
                },
                {
                    "role": "user",
                    "content": f"""Extract the following from this resume and return ONLY valid JSON (no markdown, no explanation):
{{
  "name": "full name of candidate",
  "email": "email address or empty string",
  "skills": ["skill1", "skill2", ...],
  "experience_years": number
}}
Be thorough with skills - include all technical skills mentioned.

Resume text:
{pdf_text}"""
                }
            ],
            max_tokens=1000,
            temperature=0
        )

        raw = response.choices[0].message.content
        clean = raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean)
        return {"success": True, "data": parsed}

    except json.JSONDecodeError as e:
        return {"success": False, "error": f"AI returned invalid JSON: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/create-job", summary="Create a job posting with required skills")
async def create_job(
    payload: JobCreate,
    decoded=Depends(verify_firebase_token)
):
    company_code = get_company_from_token(decoded)

    # ✅ FIXED: use 'with' so connection is always returned to pool
    with get_db(company_code) as db:
        result = db.execute(
            text("""
                INSERT INTO recruitment_jobs (title, location, description, required_skills)
                VALUES (:title, :location, :description, :required_skills)
            """),
            {
                "title": payload.title,
                "location": payload.location,
                "description": payload.description,
                "required_skills": json.dumps(payload.required_skills),
            }
        )
        job_id = result.lastrowid
        # commit() is called automatically by the context manager

    return {
        "message": "Job created successfully",
        "job_id": job_id,
        "required_skills": payload.required_skills,
    }


@router.get("/jobs", summary="List all job postings")
def get_jobs(decoded=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded)

    # ✅ FIXED
    with get_db(company_code) as db:
        rows = db.execute(text("SELECT * FROM recruitment_jobs")).mappings().all()
        jobs = []
        for r in rows:
            job = dict(r)
            job["required_skills"] = safe_json(job.get("required_skills"))
            jobs.append(job)

    return {"data": jobs}


@router.post("/screen-candidates", summary="Evaluate, rank, and shortlist multiple candidates for a job")
def screen_candidates(
    payload: BulkCandidateRequest,
    decoded=Depends(verify_firebase_token)
):
    company_code = get_company_from_token(decoded)

    # ✅ FIXED
    with get_db(company_code) as db:
        row = db.execute(
            text("SELECT * FROM recruitment_jobs WHERE id = :id"),
            {"id": payload.job_id}
        ).mappings().first()

        if not row:
            return {"error": f"Job with id {payload.job_id} not found"}

        job = dict(row)
        required_skills: List[str] = safe_json(job.get("required_skills"))

        if not required_skills:
            return {"error": "This job has no required skills defined. Cannot screen candidates."}

        evaluated = []
        for candidate in payload.candidates:
            match = calculate_match_score(candidate.skills, required_skills)
            status = determine_status(match["score"])
            evaluated.append({
                "name": candidate.name,
                "email": candidate.email,
                "skills_submitted": candidate.skills,
                "experience_years": candidate.experience_years,
                "score": match["score"],
                "matched_skills": match["matched"],
                "missing_skills": match["missing"],
                "status": status,
            })

        ranked = rank_candidates(evaluated)

        for c in ranked:
            db.execute(
                text("""
                    INSERT INTO recruitment_candidates
                        (job_id, name, email, skills, experience_years,
                         match_score, matched_skills, missing_skills, status, `rank`)
                    VALUES
                        (:job_id, :name, :email, :skills, :experience_years,
                         :match_score, :matched_skills, :missing_skills, :status, :rank)
                    ON DUPLICATE KEY UPDATE
                        match_score     = VALUES(match_score),
                        matched_skills  = VALUES(matched_skills),
                        missing_skills  = VALUES(missing_skills),
                        status          = VALUES(status),
                        `rank`          = VALUES(`rank`)
                """),
                {
                    "job_id": payload.job_id,
                    "name": c["name"],
                    "email": c["email"],
                    "skills": json.dumps(c["skills_submitted"]),
                    "experience_years": c["experience_years"],
                    "match_score": c["score"],
                    "matched_skills": json.dumps(c["matched_skills"]),
                    "missing_skills": json.dumps(c["missing_skills"]),
                    "status": c["status"],
                    "rank": c["rank"],
                }
            )
        # commit() called automatically by context manager

    shortlisted = [c for c in ranked if c["status"] != "Rejected"]
    rejected    = [c for c in ranked if c["status"] == "Rejected"]
    avg_score   = round(sum(c["score"] for c in ranked) / len(ranked), 2) if ranked else 0

    return {
        "job": {
            "id": job["id"],
            "title": job["title"],
            "location": job["location"],
            "required_skills": required_skills,
        },
        "summary": {
            "total_candidates": len(ranked),
            "shortlisted": len(shortlisted),
            "rejected": len(rejected),
            "average_score": avg_score,
            "top_candidate": ranked[0]["name"] if ranked else None,
        },
        "ranked_candidates": [
            {
                "rank": c["rank"],
                "name": c["name"],
                "email": c["email"],
                "score": c["score"],
                "status": c["status"],
                "matched_skills": c["matched_skills"],
                "missing_skills": c["missing_skills"],
                "experience_years": c["experience_years"],
            }
            for c in ranked
        ],
    }


@router.get("/candidates", summary="List all screened candidates (optionally filter by job)")
def get_candidates(
    job_id: Optional[int] = None,
    status: Optional[str] = None,
    decoded=Depends(verify_firebase_token)
):
    company_code = get_company_from_token(decoded)

    # ✅ FIXED
    with get_db(company_code) as db:
        query = "SELECT * FROM recruitment_candidates WHERE 1=1"
        params = {}
        if job_id:
            query += " AND job_id = :job_id"
            params["job_id"] = job_id
        if status:
            query += " AND status = :status"
            params["status"] = status
        query += " ORDER BY match_score DESC"

        rows = db.execute(text(query), params).mappings().all()
        candidates = []
        for r in rows:
            c = dict(r)
            c["skills"]         = safe_json(c.get("skills"))
            c["matched_skills"] = safe_json(c.get("matched_skills"))
            c["missing_skills"] = safe_json(c.get("missing_skills"))
            candidates.append(c)

    return {"data": candidates, "total": len(candidates)}


@router.get("/jobs/{job_id}/shortlist", summary="Get only shortlisted candidates for a job")
def get_shortlist(job_id: int, decoded=Depends(verify_firebase_token)):
    company_code = get_company_from_token(decoded)

    # ✅ FIXED
    with get_db(company_code) as db:
        rows = db.execute(
            text("""
                SELECT * FROM recruitment_candidates
                WHERE job_id = :job_id AND status != 'Rejected'
                ORDER BY match_score DESC
            """),
            {"job_id": job_id}
        ).mappings().all()

        candidates = []
        for r in rows:
            c = dict(r)
            c["skills"]         = safe_json(c.get("skills"))
            c["matched_skills"] = safe_json(c.get("matched_skills"))
            c["missing_skills"] = safe_json(c.get("missing_skills"))
            candidates.append(c)

    return {
        "job_id": job_id,
        "shortlisted_count": len(candidates),
        "candidates": candidates
    }