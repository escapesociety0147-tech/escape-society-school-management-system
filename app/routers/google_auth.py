import os
import httpx
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import get_db
from security import hash_password, create_access_token, generate_id
import models

load_dotenv()

router = APIRouter(prefix="/auth/google", tags=["Google OAuth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://127.0.0.1:8000/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@router.get("/login")
def google_login():
    """Redirect user to Google login page."""
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url=f"{GOOGLE_AUTH_URL}?{query}")


@router.get("/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback, create or login user, return JWT."""

    # Step 1: Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })

    if token_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get token from Google.")

    token_data = token_response.json()
    access_token = token_data.get("access_token")

    # Step 2: Get user info from Google
    async with httpx.AsyncClient() as client:
        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )

    if userinfo_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get user info from Google.")

    google_user = userinfo_response.json()
    email = google_user.get("email", "").lower().strip()
    name = google_user.get("name", "")

    if not email:
        raise HTTPException(status_code=400, detail="Could not get email from Google account.")

    # Step 3: Find or create user in database
    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        # New user — create account automatically
        user = models.User(
            name=name,
            email=email,
            password=hash_password(generate_id("GOOGLE")),  # Random password they will never use
            role="parent",  # Default role for Google signups
            school_id=None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Step 4: Generate JWT token
    jwt_token = create_access_token({
        "sub": str(user.id),
        "role": user.role,
        "email": user.email
    })

    # Step 5: Redirect to frontend with token
    return RedirectResponse(
        url=f"{FRONTEND_URL}/auth/callback?token={jwt_token}&role={user.role}&name={user.name}"
    )
