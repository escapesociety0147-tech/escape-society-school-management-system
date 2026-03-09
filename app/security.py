import hmac
import hashlib
import base64
import json
import time
import uuid
import os
import bcrypt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
import models

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY      = os.getenv("SECRET_KEY",      "escape-society-sms-secret-key-change-in-production")
REFRESH_SECRET  = os.getenv("REFRESH_SECRET",  "escape-society-sms-refresh-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24   # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS   = 30        # 30 days

security = HTTPBearer()


# ── Password Hashing (bcrypt) ─────────────────────────────────────────────────

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


# ── JWT helpers ───────────────────────────────────────────────────────────────

def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64decode(data: str) -> bytes:
    padding = 4 - len(data) % 4
    return base64.urlsafe_b64decode(data + "=" * padding)

def _make_token(data: dict, secret: str, expires_seconds: int) -> str:
    header          = _b64encode(json.dumps({"alg": ALGORITHM, "typ": "JWT"}).encode())
    payload         = {**data, "exp": int(time.time()) + expires_seconds, "iat": int(time.time())}
    payload_encoded = _b64encode(json.dumps(payload).encode())
    sig_input       = f"{header}.{payload_encoded}".encode()
    signature       = _b64encode(hmac.new(secret.encode(), sig_input, hashlib.sha256).digest())
    return f"{header}.{payload_encoded}.{signature}"

def _decode_token(token: str, secret: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid token format")
        header, payload_encoded, signature = parts
        sig_input    = f"{header}.{payload_encoded}".encode()
        expected_sig = _b64encode(hmac.new(secret.encode(), sig_input, hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected_sig):
            raise ValueError("Invalid signature")
        payload = json.loads(_b64decode(payload_encoded))
        if payload.get("exp", 0) < int(time.time()):
            raise ValueError("Token has expired")
        return payload
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e), headers={"WWW-Authenticate": "Bearer"})
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})


# ── Public token functions ────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    return _make_token({**data, "type": "access"}, SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES * 60)

def create_refresh_token(data: dict) -> str:
    return _make_token({**data, "type": "refresh"}, REFRESH_SECRET, REFRESH_TOKEN_EXPIRE_DAYS * 86400)

def decode_token(token: str) -> dict:
    return _decode_token(token, SECRET_KEY)

def decode_refresh_token(token: str) -> dict:
    payload = _decode_token(token, REFRESH_SECRET)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    return payload


# ── Auth Dependencies ─────────────────────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
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
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def require_teacher_or_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Teacher or admin access required")
    return current_user

def require_parent(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "parent":
        raise HTTPException(status_code=403, detail="Parent access required")
    return current_user

def require_student(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    return current_user


# ── ID Generator ──────────────────────────────────────────────────────────────

def generate_id(prefix: str) -> str:
    return f"{prefix}-{str(uuid.uuid4())[:8].upper()}"
