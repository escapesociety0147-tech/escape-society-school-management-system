"""Aggregates all v1 feature routers into a single router, mounted
once in main.py under /api/v1. Individual feature routers (auth,
users, schools, ...) stay focused on their own resource prefix and
never need to know the API version themselves.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router

router = APIRouter()
router.include_router(auth_router)
