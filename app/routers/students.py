from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from security import get_current_user, require_admin, generate_id
import models
import schemas

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("", response_model=List[schemas.StudentResponse])
def get_students(
    school_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Student)

    if current_user.role == "admin":
        # Admin sees all students, optionally filtered by school
        if school_id:
            query = query.filter(models.Student.school_id == school_id)

    elif current_user.role == "teacher":
        # Teacher only sees students assigned to them
        query = query.filter(models.Student.teacher_user_id == current_user.id)

    elif current_user.role == "parent":
        # Parent only sees their own children
        query = query.filter(models.Student.parent_user_id == current_user.id)

    elif current_user.role == "student":
        # Student only sees their own record
        query = query.filter(models.Student.user_id == current_user.id)

    else:
        raise HTTPException(status_code=403, detail="Access denied")

    return query.all()


@router.get("/{student_id}", response_model=schemas.StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Check access rights
    if current_user.role == "admin":
        pass  # Full access
    elif current_user.role == "teacher":
        if student.teacher_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You are not assigned to this student.")
    elif current_user.role == "parent":
        if student.parent_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="This student is not linked to your account.")
    elif current_user.role == "student":
        if student.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only view your own record.")
    else:
        raise HTTPException(status_code=403, detail="Access denied")

    return student


@router.post("", response_model=schemas.StudentResponse, status_code=201)
def create_student(
    payload: schemas.StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
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
        user_id=payload.user_id,
        parent_user_id=payload.parent_user_id,
        teacher_user_id=payload.teacher_user_id,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.put("/{student_id}", response_model=schemas.StudentResponse)
def update_student(
    student_id: int,
    payload: schemas.StudentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    for field, value in payload.dict(exclude_none=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}", response_model=schemas.MessageResponse)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully."}
