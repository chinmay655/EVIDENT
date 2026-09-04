"""Pydantic request/response schemas."""
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
import re

# ---------- Auth ----------
class RegisterIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str
    confirm_password: str
    phone: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    skills: List[str] = []

    @field_validator("password")
    @classmethod
    def strong(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must contain letters and numbers")
        return v

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class ForgotIn(BaseModel):
    email: EmailStr

class ResetIn(BaseModel):
    token: str
    password: str

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    college: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[int] = None
    skills: Optional[List[str]] = None
    bio: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None

# ---------- Projects (admin) ----------
class TaskIn(BaseModel):
    id: Optional[str] = None
    title: str
    description: str = ""
    instructions: str = ""
    order: int = 0
    estimated_hours: Optional[float] = None
    difficulty: str = "Intermediate"
    required: bool = True
    evaluation_notes: str = ""
    depends_on: Optional[str] = None
    submission_requirements: str = ""

class ResourceIn(BaseModel):
    id: Optional[str] = None
    title: str
    description: str = ""
    type: str = "link"  # pdf/docx/xlsx/csv/zip/image/link/video/doc
    file_id: Optional[str] = None
    external_url: Optional[str] = None
    order: int = 0
    visibility: str = "enrolled"  # public/enrolled/admin_only

class ProjectIn(BaseModel):
    title: str
    slug: Optional[str] = None
    short_description: str = ""
    full_description: str = ""
    category: str = "Web Development"
    difficulty: str = "Intermediate"
    technologies: List[str] = []
    skills: List[str] = []
    duration_days: int = 28
    price: int = 999
    currency: str = "INR"
    thumbnail: Optional[str] = None
    project_banner: Optional[str] = None
    requirements: List[str] = []
    learning_outcomes: List[str] = []
    what_student_will_build: str = ""
    what_student_will_submit: str = ""
    project_type: str = "individual"
    featured: bool = False
    enrollment_limit: Optional[int] = None
    estimated_hours: Optional[float] = None
    submission_requirements: List[str] = []
    evaluation_criteria: List[str] = []
    certificate_config: dict = {}
    tasks: List[TaskIn] = []
    resources: List[ResourceIn] = []

# ---------- Enrollment / Payment ----------
class EnrollIn(BaseModel):
    project_id: str
    resume_file_id: str
    accept_terms: bool

class CreateOrderIn(BaseModel):
    enrollment_id: str

class VerifyPaymentIn(BaseModel):
    enrollment_id: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    sandbox: bool = False

# ---------- Workspace ----------
class TaskProgressIn(BaseModel):
    student_completed: bool

class SubmissionIn(BaseModel):
    github_url: str
    deployed_url: Optional[str] = None
    description: str = ""
    technologies: List[str] = []
    challenges: str = ""
    solution_summary: str = ""
    screenshots: List[str] = []
    demo_video: Optional[str] = None
    submit: bool = True  # False = save draft

class QuestionIn(BaseModel):
    enrollment_id: str
    subject: str
    message: str

class AnswerIn(BaseModel):
    answer: str

# ---------- Admin review ----------
class ReviewIn(BaseModel):
    feedback: Optional[str] = None
    required_changes: Optional[str] = None
    priority: Optional[str] = None

class ExtendDeadlineIn(BaseModel):
    due_date: str
    reason: str = ""

class EvidenceVisibilityIn(BaseModel):
    is_public: bool
