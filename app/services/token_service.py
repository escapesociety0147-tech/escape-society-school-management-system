"""
JWT access token service.

Thin wrapper around PyJWT. Creates and decodes access tokens carrying
the claims the rest of the application needs for authentication and
tenant-scoped authorization: who the user is (sub), which session this
token belongs to (sid - directly UserSession.id, no separate session
identifier column exists), their role (RBAC checks), and their school
(tenant scoping).

decode_access_token() deliberately lets PyJWT's specific exceptions
(ExpiredSignatureError, InvalidSignatureError, DecodeError, etc.)
propagate rather than collapsing them into a single failure outcome.
Unlike password verification - where every failure means the same thing
to a caller ("deny authentication") - different token-decode failures
warrant different downstream handling (an expired token might trigger a
refresh attempt; an invalid signature is a security event, not a
routine retry). Hiding that distinction behind a generic return value
would throw away information PyJWT already provides for free.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from app.core.config import get_settings
from app.models.user import UserRole


def create_access_token(
    user_id: uuid.UUID,
    session_id: uuid.UUID,
    role: UserRole,
    school_id: uuid.UUID,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Creates a signed JWT access token.

    UUIDs are converted to strings here, inside the service - callers
    always pass real UUID/UserRole objects; the service owns the
    serialization so no caller can accidentally pass a raw string for
    one claim and a UUID for another.

    expires_delta defaults to settings.ACCESS_TOKEN_EXPIRE_MINUTES when
    not supplied.
    """
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expires_delta = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),
        "sid": str(session_id),
        "role": role.value,
        "school_id": str(school_id),
        "iat": now,
        "exp": now + expires_delta,
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY.get_secret_value(),
        algorithm=settings.ALGORITHM,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    """
    Decodes and verifies a JWT access token.

    Raises PyJWT's own exceptions on failure (jwt.exceptions) - callers
    should catch specific exception types (ExpiredSignatureError,
    InvalidSignatureError, InvalidTokenError, etc.) to drive different
    handling per failure reason, rather than a single generic
    valid/invalid outcome.
    """
    settings = get_settings()

    return jwt.decode(
        token,
        settings.SECRET_KEY.get_secret_value(),
        algorithms=[settings.ALGORITHM],
    )