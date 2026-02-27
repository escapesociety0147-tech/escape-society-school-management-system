import os
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import get_db
from security import get_current_user, require_admin
import models

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

router = APIRouter(prefix="/upload", tags=["Photo Upload"])


@router.post("/student/{student_id}")
async def upload_student_photo(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    contents = await file.read()
    result = cloudinary.uploader.upload(
        contents,
        folder="esm/students",
        public_id=f"student_{student_id}",
        overwrite=True,
        resource_type="image"
    )

    student.photo_url = result["secure_url"]
    db.commit()
    db.refresh(student)
    return {"photo_url": student.photo_url, "message": "Photo uploaded successfully."}


@router.post("/teacher/{teacher_id}")
async def upload_teacher_photo(
    teacher_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")

    contents = await file.read()
    result = cloudinary.uploader.upload(
        contents,
        folder="esm/teachers",
        public_id=f"teacher_{teacher_id}",
        overwrite=True,
        resource_type="image"
    )

    teacher.photo_url = result["secure_url"]
    db.commit()
    db.refresh(teacher)
    return {"photo_url": teacher.photo_url, "message": "Photo uploaded successfully."}


@router.post("/profile")
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    contents = await file.read()
    result = cloudinary.uploader.upload(
        contents,
        folder="esm/profiles",
        public_id=f"user_{current_user.id}",
        overwrite=True,
        resource_type="image"
    )

    current_user.photo_url = result["secure_url"]
    db.commit()
    db.refresh(current_user)
    return {"photo_url": current_user.photo_url, "message": "Profile photo uploaded successfully."}


@router.post("/school")
async def upload_school_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    contents = await file.read()
    result = cloudinary.uploader.upload(
        contents,
        folder="esm/schools",
        public_id=f"school_{current_user.school_id or current_user.id}",
        overwrite=True,
        resource_type="image"
    )
    return {"photo_url": result["secure_url"], "message": "School logo uploaded successfully."}
