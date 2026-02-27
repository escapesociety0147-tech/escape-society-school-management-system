from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from security import get_current_user, require_admin, generate_id
import models
import schemas

router = APIRouter(prefix="/teachers", tags=["Teachers"])


@router.get("", response_model=List[schemas.TeacherResponse])
def get_teachers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return db.query(models.Teacher).all()
    elif current_user.role == "teacher":
        # Teacher can only see their own record
        return db.query(models.Teacher).filter(models.Teacher.user_id == current_user.id).all()
    else:
        raise HTTPException(status_code=403, detail="Access denied")


@router.post("", response_model=schemas.TeacherResponse, status_code=201)
def create_teacher(
    payload: schemas.TeacherCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
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
        user_id=payload.user_id,
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.put("/{teacher_id}", response_model=schemas.TeacherResponse)
def update_teacher(
    teacher_id: int,
    payload: schemas.TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")
    for field, value in payload.dict(exclude_none=True).items():
        setattr(teacher, field, value)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.delete("/{teacher_id}", response_model=schemas.MessageResponse)
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")
    db.delete(teacher)
    db.commit()
    return {"message": "Teacher deleted successfully."}
