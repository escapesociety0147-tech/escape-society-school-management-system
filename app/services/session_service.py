"""
Session lifecycle service.

Owns session creation, lookup, rotation, and revocation - persistence
and state transitions only. This module deliberately does NOT verify
passwords, look up users by email, decide whether a login succeeds, or
perform authorization. That composition belongs to the future
AuthService, which will call into this module the same way it calls
into password_service and token_service.

The JWT (sid claim, verified by token_service) and the refresh token
(hashed here, verified by hash lookup) are intentionally two separate
lookup paths - get_active_session_by_id and
get_active_session_by_refresh_token answer genuinely different
questions and are never merged into one overloaded function.
"""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.user import User
from app.models.user_session import UserSession


def _utc_now() -> datetime:
    """
    Returns the current UTC time as a naive datetime.

    The application stores UTC in MySQL DATETIME columns, which are
    returned as naive datetimes. All comparisons against persisted
    timestamps go through this helper to avoid mixing naive and
    offset-aware datetime objects.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _hash_refresh_token(token: str) -> str:
    """
    Single source of truth for how refresh tokens are hashed. SHA-256 is
    sufficient (not Argon2id) because the token is server-generated with
    high entropy already - see UserSession's model docstring for the
    full reasoning.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _compute_session_expiry(*, remember_me: bool) -> datetime:
    """
    Isolates the remember-me lifetime policy so it's independently
    readable and testable, rather than embedded as an if/else inside
    create_session(). Returns naive UTC, consistent with _utc_now().
    """
    settings = get_settings()
    minutes = (
        settings.REMEMBER_ME_SESSION_LIFETIME_MINUTES
        if remember_me
        else settings.SESSION_LIFETIME_MINUTES
    )
    return _utc_now() + timedelta(minutes=minutes)


def _is_active(session: UserSession | None) -> UserSession | None:
    """
    Shared "is this session usable" check for both lookup functions, so
    the two paths can never accidentally diverge in their definition of
    active. Deliberately collapses nonexistent/revoked/expired into the
    same None result - the caller gains nothing from distinguishing
    those cases, and collapsing them avoids leaking why a session is
    invalid.
    """
    if session is None:
        return None
    if session.revoked_at is not None:
        return None
    if session.expires_at <= _utc_now():
        return None
    return session


def create_session(
    db_session: Session,
    user: User,
    *,
    remember_me: bool = False,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> tuple[UserSession, str]:
    """
    Creates and persists a new session, returning (session_row,
    plaintext_refresh_token). The plaintext token is returned exactly
    once, here - only its hash is ever stored. Callers must not attempt
    to regenerate or recover it later.

    This function does not create a JWT - that's the caller's
    (eventually AuthService's) responsibility, and deliberately happens
    only after the session row is successfully committed, so a failed
    commit can never result in a JWT referencing a session that doesn't
    exist.
    """
    refresh_token = secrets.token_urlsafe(64)

    session = UserSession(
        user_id=user.id,
        refresh_token_hash=_hash_refresh_token(refresh_token),
        ip_address=ip_address,
        user_agent=user_agent,
        expires_at=_compute_session_expiry(remember_me=remember_me),
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)

    return session, refresh_token


def get_active_session_by_id(db_session: Session, session_id: uuid.UUID) -> UserSession | None:
    """
    For access-token authentication: the JWT has already been verified
    by token_service, and its sid claim is passed here.
    """
    return _is_active(db_session.get(UserSession, session_id))


def get_active_session_by_refresh_token(
    db_session: Session, refresh_token: str
) -> UserSession | None:
    """
    For the refresh flow: the client presents a plaintext refresh token
    (no JWT involved, since the access token may already be expired).
    Hashes the token and looks up by refresh_token_hash.
    """
    token_hash = _hash_refresh_token(refresh_token)
    session = db_session.scalar(
        select(UserSession).where(UserSession.refresh_token_hash == token_hash)
    )
    return _is_active(session)


def rotate_refresh_token(db_session: Session, session: UserSession) -> str:
    """
    Replaces the session's refresh token with a newly generated one,
    invalidating the old one immediately (since only the hash is
    compared, and the old token's hash no longer matches anything once
    overwritten). Returns the new plaintext token. Same session row -
    rotation is not a new login.
    """
    new_refresh_token = secrets.token_urlsafe(64)
    session.refresh_token_hash = _hash_refresh_token(new_refresh_token)
    db_session.commit()
    db_session.refresh(session)

    return new_refresh_token


def revoke_session(db_session: Session, session: UserSession) -> None:
    """
    Marks a single session as revoked. Idempotent: calling this on an
    already-revoked session leaves the original revoked_at timestamp
    untouched rather than overwriting it with a later, less accurate
    value - identical semantics to revoke_all_sessions(). Never deletes
    the row - same retain-for-audit philosophy as User.deleted_at.
    """
    if session.revoked_at is not None:
        return

    session.revoked_at = _utc_now()
    db_session.commit()


def revoke_all_sessions(db_session: Session, user: User) -> None:
    """
    Revokes every currently-active session for a user (e.g. "log out
    everywhere," or a forced revocation after a password change).
    Already-revoked sessions are left untouched.
    """
    now = _utc_now()
    active_sessions = db_session.scalars(
        select(UserSession).where(
            UserSession.user_id == user.id,
            UserSession.revoked_at.is_(None),
        )
    ).all()

    for session in active_sessions:
        session.revoked_at = now

    db_session.commit()