"""Pydantic request/response schemas for the /auth/* endpoints.

These describe the shape of data crossing the HTTP boundary only -
they are not persistence models (see app/models/) and they never
leak SQLAlchemy internals (deleted_at, created_at, relationships)
into API responses.
"""

from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class LoginRequest(BaseModel):
    """Body for POST /auth/login."""

    email: EmailStr
    password: str
    remember_me: bool = False


class UserResponse(BaseModel):
    """Public-facing representation of a User.

    Deliberately excludes deleted_at, created_at, updated_at, and any
    relationship data - those are persistence concerns, not API
    concerns.
    """

    model_config = {"from_attributes": True}

    id: UUID
    school_id: UUID
    email: EmailStr
    role: UserRole


class LoginResponse(BaseModel):
    """Body returned by POST /auth/login.

    Tokens are never included here - they exist exclusively as
    HttpOnly cookies, set separately by the route via
    set_auth_cookies(). This keeps JavaScript from ever touching them.
    """

    user: UserResponse


class MessageResponse(BaseModel):
    """Generic body for endpoints that only confirm an action
    happened, with no data payload - refresh, logout, and logout-all
    share this shape rather than each getting a near-identical
    single-field model.
    """

    message: str
