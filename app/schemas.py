from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str  # admin, teacher, parent, student
    school_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    school_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    token: str
    user: UserResponse


# ── Student ───────────────────────────────────────────────────────────────────

class StudentCreate(BaseModel):
    name: str
    email: str
    contact: Optional[str] = None
    roll_number: Optional[str] = None
    grade: Optional[str] = None
    section: Optional[str] = None
    school_id: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    contact: Optional[str] = None
    roll_number: Optional[str] = None
    grade: Optional[str] = None
    section: Optional[str] = None

class StudentResponse(BaseModel):
    id: int
    student_id: str
    name: str
    email: str
    contact: Optional[str]
    roll_number: Optional[str]
    grade: Optional[str]
    section: Optional[str]
    school_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Teacher ───────────────────────────────────────────────────────────────────

class TeacherCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    subjects: Optional[str] = None
    school_id: Optional[str] = None

class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    subjects: Optional[str] = None

class TeacherResponse(BaseModel):
    id: int
    emp_id: str
    name: str
    email: str
    phone: Optional[str]
    department: Optional[str]
    subjects: Optional[str]
    school_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Parent ────────────────────────────────────────────────────────────────────

class ParentCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    relationship: Optional[str] = "Parent"
    school_id: Optional[str] = None

class ParentResponse(BaseModel):
    id: int
    parent_id: str
    name: str
    email: str
    phone: Optional[str]
    relationship: Optional[str]
    school_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Attendance ────────────────────────────────────────────────────────────────

class AttendanceCreate(BaseModel):
    student_id: int
    date: str
    status: str  # present, absent, late

class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    date: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Result ────────────────────────────────────────────────────────────────────

class ResultCreate(BaseModel):
    student_id: int
    subject: str
    score: float
    grade: Optional[str] = None
    term: Optional[str] = None

class ResultResponse(BaseModel):
    id: int
    student_id: int
    subject: str
    score: float
    grade: Optional[str]
    term: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Payment ───────────────────────────────────────────────────────────────────

class PaymentCreate(BaseModel):
    student_id: int
    amount_due: float
    amount_paid: Optional[float] = 0
    status: Optional[str] = "pending"
    fee_type: Optional[str] = None
    last_payment: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    student_id: int
    amount_due: float
    amount_paid: float
    status: str
    fee_type: Optional[str]
    last_payment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Event ─────────────────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    school_id: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    date: Optional[str]
    time: Optional[str]
    location: Optional[str]
    category: Optional[str]
    school_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Generic ───────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str

class StatsResponse(BaseModel):
    total_students: int
    total_teachers: int
    total_parents: int
    attendance_rate: float
    total_revenue: float