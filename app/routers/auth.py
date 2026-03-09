from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from database import get_db
from security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_refresh_token,
    get_current_user, generate_id
)
import models
import schemas

router = APIRouter(prefix="/auth", tags=["Authentication"])


def generate_school_id() -> str:
    import uuid
    return f"SCH-{str(uuid.uuid4())[:8].upper()}"


# ── Register ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=schemas.UserResponse, status_code=201)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(
        func.lower(models.User.email) == payload.email.strip().lower()
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    school_id = payload.school_id
    if payload.role == "admin" and not school_id:
        school_id = generate_school_id()

    user = models.User(
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        password=hash_password(payload.password),
        role=payload.role,
        school_id=school_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        func.lower(models.User.email) == payload.email.strip().lower()
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="No account found for this email.")
    if not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Incorrect password.")

    token_data = {"sub": str(user.id), "role": user.role, "email": user.email}
    access_token  = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return {
        "token": access_token,
        "refresh_token": refresh_token,
        "user": user,
    }


# ── Refresh ───────────────────────────────────────────────────────────────────

class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_refresh_token(body.refresh_token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token payload")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    token_data    = {"sub": str(user.id), "role": user.role, "email": user.email}
    access_token  = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# ── Me ────────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
