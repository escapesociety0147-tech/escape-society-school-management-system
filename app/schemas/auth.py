"""Pydantic request/response schemas for the /auth/* endpoints.

These describe the shape of data crossing the HTTP boundary only -
they are not persistence models (see app/models/) and they never
leak SQLAlchemy internals (deleted_at, created_at, relationships)
into API responses.
"""

from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.user import User, UserRole


class LoginRequest(BaseModel):
    """Body for POST /auth/login."""

    email: EmailStr
    password: str
    remember_me: bool = False


class UserResponse(BaseModel):
    """Public-facing representation of a User.

    Deliberately excludes deleted_at, created_at, updated_at, and any
    relationship data - those are persistence concerns, not API
    concerns. Built via from_user() rather than Pydantic's ORM mode -
    an explicit translation method keeps ORM-to-API serialization in
    one obvious place, consistent with this project's separation of
    service-layer objects, ORM models, and HTTP concerns.
    """

    id: UUID
    school_id: UUID
    email: EmailStr
    name: str
    role: UserRole

    @classmethod
    def from_user(cls, user: User) -> "UserResponse":
        return cls(
            id=user.id,
            school_id=user.school_id,
            email=user.email,
            name=user.name,
            role=user.role,
        )


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
