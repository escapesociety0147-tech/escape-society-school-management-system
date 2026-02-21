import hmac
import hashlib
import base64
import json
import time
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import models

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY = "escape-society-sms-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer()


# ── Password Hashing (bcrypt-style using hashlib) ─────────────────────────────

def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt."""
    salt = "esm_salt_escape_society"
    return hashlib.sha256(f"{salt}{password}{salt}".encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password


# ── JWT Implementation ────────────────────────────────────────────────────────

def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64decode(data: str) -> bytes:
    padding = 4 - len(data) % 4
    return base64.urlsafe_b64decode(data + "=" * padding)


def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    """Create a JWT token with expiry."""
    header = _b64encode(json.dumps({"alg": ALGORITHM, "typ": "JWT"}).encode())
    payload = {**data, "exp": int(time.time()) + expires_minutes * 60, "iat": int(time.time())}
    payload_encoded = _b64encode(json.dumps(payload).encode())
    signature_input = f"{header}.{payload_encoded}".encode()
    signature = _b64encode(hmac.new(SECRET_KEY.encode(), signature_input, hashlib.sha256).digest())
    return f"{header}.{payload_encoded}.{signature}"


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid token format")

        header, payload_encoded, signature = parts

        # Verify signature
        signature_input = f"{header}.{payload_encoded}".encode()
        expected_sig = _b64encode(hmac.new(SECRET_KEY.encode(), signature_input, hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected_sig):
            raise ValueError("Invalid signature")

        # Decode payload
        payload = json.loads(_b64decode(payload_encoded))

        # Check expiry
        if payload.get("exp", 0) < int(time.time()):
            raise ValueError("Token has expired")

        return payload

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Auth Dependencies ─────────────────────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    """Get the currently authenticated user from the JWT token."""
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Only allow admin users."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_teacher_or_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    """Allow teachers and admins."""
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Teacher or admin access required")
    return current_user


# ── ID Generator ──────────────────────────────────────────────────────────────

import uuid

def generate_id(prefix: str) -> str:
    return f"{prefix}-{str(uuid.uuid4())[:8].upper()}"
