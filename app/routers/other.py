from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from security import get_current_user, require_admin, generate_id
import models
import schemas

# ── Parents ───────────────────────────────────────────────────────────────────
parents_router = APIRouter(prefix="/parents", tags=["Parents"])

@parents_router.get("", response_model=List[schemas.ParentResponse])
def get_parents(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Parent).all()

@parents_router.post("", response_model=schemas.ParentResponse, status_code=201)
def create_parent(payload: schemas.ParentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    existing = db.query(models.Parent).filter(func.lower(models.Parent.email) == payload.email.strip().lower()).first()
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
attendance_router = APIRouter(prefix="/attendance", tags=["Attendance"])

@attendance_router.get("", response_model=List[schemas.AttendanceResponse])
def get_attendance(student_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Attendance)
    if student_id:
        query = query.filter(models.Attendance.student_id == student_id)
    return query.all()

@attendance_router.post("", response_model=schemas.AttendanceResponse, status_code=201)
def record_attendance(payload: schemas.AttendanceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    record = models.Attendance(student_id=payload.student_id, date=payload.date, status=payload.status)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ── Results ───────────────────────────────────────────────────────────────────
results_router = APIRouter(prefix="/results", tags=["Results"])

@results_router.get("", response_model=List[schemas.ResultResponse])
def get_results(student_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Result)
    if student_id:
        query = query.filter(models.Result.student_id == student_id)
    return query.all()

@results_router.post("", response_model=schemas.ResultResponse, status_code=201)
def create_result(payload: schemas.ResultCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    result = models.Result(**payload.dict())
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


# ── Payments ──────────────────────────────────────────────────────────────────
payments_router = APIRouter(prefix="/payments", tags=["Payments"])

@payments_router.get("", response_model=List[schemas.PaymentResponse])
def get_payments(student_id: Optional[int] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Payment)
    if student_id:
        query = query.filter(models.Payment.student_id == student_id)
    return query.all()

@payments_router.post("", response_model=schemas.PaymentResponse, status_code=201)
def create_payment(payload: schemas.PaymentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    payment = models.Payment(**payload.dict())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


# ── Events ────────────────────────────────────────────────────────────────────
events_router = APIRouter(prefix="/events", tags=["Events"])

@events_router.get("", response_model=List[schemas.EventResponse])
def get_events(school_id: Optional[str] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    query = db.query(models.Event)
    if school_id:
        query = query.filter(models.Event.school_id == school_id)
    return query.all()

@events_router.post("", response_model=schemas.EventResponse, status_code=201)
def create_event(payload: schemas.EventCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    event = models.Event(**payload.dict())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@events_router.delete("/{event_id}", response_model=schemas.MessageResponse)
def delete_event(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully."}


# ── Stats ─────────────────────────────────────────────────────────────────────
stats_router = APIRouter(prefix="/stats", tags=["Dashboard"])

@stats_router.get("", response_model=schemas.StatsResponse)
def get_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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
