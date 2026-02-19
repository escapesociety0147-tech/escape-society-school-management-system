from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import uuid
import hashlib
from datetime import datetime

from database import engine, get_db, Base
import models
import schemas

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Escape Society School Management API", version="2.0.0")

# ── CORS (allows Next.js frontend to talk to this API) ───────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_id(prefix: str) -> str:
    return f"{prefix}-{str(uuid.uuid4())[:8].upper()}"

def fake_token(user_id: int, role: str) -> str:
    return f"tok_{user_id}_{role}_{uuid.uuid4().hex[:12]}"


# ── Root ──────────────────────────────────────────────────────────────────────

@app.get("/")
def index():
    return {"message": "Escape Society School Management System API v2.0 is running"}


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=schemas.UserResponse, status_code=201)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        func.lower(models.User.email) == payload.email.strip().lower()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = models.User(
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        password=hash_password(payload.password),
        role=payload.role,
        school_id=payload.school_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        func.lower(models.User.email) == payload.email.strip().lower()
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="No account found for this email.")
    if user.password != hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Incorrect password.")

    token = fake_token(user.id, user.role)
    return {"token": token, "user": user}


# ── Dashboard Stats ───────────────────────────────────────────────────────────

@app.get("/stats", response_model=schemas.StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    total_students = db.query(models.Student).count()
    total_teachers = db.query(models.Teacher).count()
    total_parents = db.query(models.Parent).count()

    attendance_records = db.query(models.Attendance).all()
    if attendance_records:
        present = sum(1 for r in attendance_records if r.status == "present")
        rate = round((present / len(attendance_records)) * 100, 1)
    else:
        rate = 0.0

    payments = db.query(models.Payment).all()
    revenue = sum(p.amount_paid for p in payments)

    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_parents": total_parents,
        "attendance_rate": rate,
        "total_revenue": revenue,
    }


# ── Students ──────────────────────────────────────────────────────────────────

@app.get("/students", response_model=List[schemas.StudentResponse])
def get_students(school_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Student)
    if school_id:
        query = query.filter(models.Student.school_id == school_id)
    return query.all()


@app.get("/students/{student_id}", response_model=schemas.StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student


@app.post("/students", response_model=schemas.StudentResponse, status_code=201)
def create_student(payload: schemas.StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Student).filter(
        func.lower(models.Student.email) == payload.email.strip().lower()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A student with this email already exists.")

    student = models.Student(
        student_id=generate_id("STU"),
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        contact=payload.contact,
        roll_number=payload.roll_number,
        grade=payload.grade,
        section=payload.section,
        school_id=payload.school_id,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@app.put("/students/{student_id}", response_model=schemas.StudentResponse)
def update_student(student_id: int, payload: schemas.StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    for field, value in payload.dict(exclude_none=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student


@app.delete("/students/{student_id}", response_model=schemas.MessageResponse)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully."}


# ── Teachers ──────────────────────────────────────────────────────────────────

@app.get("/teachers", response_model=List[schemas.TeacherResponse])
def get_teachers(school_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Teacher)
    if school_id:
        query = query.filter(models.Teacher.school_id == school_id)
    return query.all()


@app.post("/teachers", response_model=schemas.TeacherResponse, status_code=201)
def create_teacher(payload: schemas.TeacherCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Teacher).filter(
        func.lower(models.Teacher.email) == payload.email.strip().lower()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A teacher with this email already exists.")

    teacher = models.Teacher(
        emp_id=generate_id("EMP"),
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        phone=payload.phone,
        department=payload.department,
        subjects=payload.subjects,
        school_id=payload.school_id,
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


@app.put("/teachers/{teacher_id}", response_model=schemas.TeacherResponse)
def update_teacher(teacher_id: int, payload: schemas.TeacherUpdate, db: Session = Depends(get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")
    for field, value in payload.dict(exclude_none=True).items():
        setattr(teacher, field, value)
    db.commit()
    db.refresh(teacher)
    return teacher


@app.delete("/teachers/{teacher_id}", response_model=schemas.MessageResponse)
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")
    db.delete(teacher)
    db.commit()
    return {"message": "Teacher deleted successfully."}


# ── Parents ───────────────────────────────────────────────────────────────────

@app.get("/parents", response_model=List[schemas.ParentResponse])
def get_parents(db: Session = Depends(get_db)):
    return db.query(models.Parent).all()


@app.post("/parents", response_model=schemas.ParentResponse, status_code=201)
def create_parent(payload: schemas.ParentCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Parent).filter(
        func.lower(models.Parent.email) == payload.email.strip().lower()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A parent with this email already exists.")

    parent = models.Parent(
        parent_id=generate_id("PAR"),
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        phone=payload.phone,
        relationship=payload.relationship,
        school_id=payload.school_id,
    )
    db.add(parent)
    db.commit()
    db.refresh(parent)
    return parent


# ── Attendance ────────────────────────────────────────────────────────────────

@app.get("/attendance", response_model=List[schemas.AttendanceResponse])
def get_attendance(student_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Attendance)
    if student_id:
        query = query.filter(models.Attendance.student_id == student_id)
    return query.all()


@app.post("/attendance", response_model=schemas.AttendanceResponse, status_code=201)
def record_attendance(payload: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    record = models.Attendance(
        student_id=payload.student_id,
        date=payload.date,
        status=payload.status,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ── Results ───────────────────────────────────────────────────────────────────

@app.get("/results", response_model=List[schemas.ResultResponse])
def get_results(student_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Result)
    if student_id:
        query = query.filter(models.Result.student_id == student_id)
    return query.all()


@app.post("/results", response_model=schemas.ResultResponse, status_code=201)
def create_result(payload: schemas.ResultCreate, db: Session = Depends(get_db)):
    result = models.Result(**payload.dict())
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


# ── Payments ──────────────────────────────────────────────────────────────────

@app.get("/payments", response_model=List[schemas.PaymentResponse])
def get_payments(student_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Payment)
    if student_id:
        query = query.filter(models.Payment.student_id == student_id)
    return query.all()


@app.post("/payments", response_model=schemas.PaymentResponse, status_code=201)
def create_payment(payload: schemas.PaymentCreate, db: Session = Depends(get_db)):
    payment = models.Payment(**payload.dict())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


# ── Events ────────────────────────────────────────────────────────────────────

@app.get("/events", response_model=List[schemas.EventResponse])
def get_events(school_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Event)
    if school_id:
        query = query.filter(models.Event.school_id == school_id)
    return query.all()


@app.post("/events", response_model=schemas.EventResponse, status_code=201)
def create_event(payload: schemas.EventCreate, db: Session = Depends(get_db)):
    event = models.Event(**payload.dict())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@app.delete("/events/{event_id}", response_model=schemas.MessageResponse)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully."}