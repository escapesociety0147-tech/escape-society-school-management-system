"""Authentication orchestration service.

This module is the ONLY place password_service, token_service, and
session_service are composed together. It owns login/logout/refresh
flows and nothing else.

This module does NOT:
- hash or verify passwords itself (delegates to password_service)
- construct or decode JWTs itself (delegates to token_service)
- construct, hash, or persist refresh tokens or session rows itself
  (delegates to session_service)
- know about HTTP, cookies, or request/response objects (that's the
  API route layer's job)
- perform authorization/RBAC decisions
- apply login rate limiting / lockout policy (PRD 8.1, deferred)
"""

from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.user_password import UserPassword
from app.services import password_service, session_service, token_service

# TODO(confirm): precomputed Argon2id hash of a fixed dummy password,
# used only to keep the "email not found" path's cost roughly in line
# with the "email found, password wrong" path. Generate this once via
# password_service.hash_password(<any fixed string>) and hardcode the
# resulting hash here - do NOT compute it at request time, and do NOT
# use a real password or a real user's hash.
_DUMMY_PASSWORD_HASH = "$argon2id$v=19$m=65536,t=3,p=4$VN1eIgHLZ3H7hVXqAW3rbg$c5dJqBr8fVKpjJaq0U45de6AjRZTxFpsAIumndi5nbk"


class InvalidCredentialsError(Exception):
    """Raised when email/password authentication fails.

    Deliberately generic: covers both "no user with this email" and
    "wrong password" so the route layer has exactly one case to
    translate into a 401, and callers can never distinguish which
    one occurred.
    """


@dataclass(frozen=True)
class LoginResult:
    """Everything a caller needs after a successful login.

    A dataclass rather than a tuple so new fields (e.g. session
    expiry, remember_me echo) can be added later without breaking
    positional callers.
    """

    user: User
    access_token: str
    refresh_token: str


def _normalize_email(email: str) -> str:
    """Normalize an email for lookup/comparison.

    Business logic, not persistence - kept out of the User model on
    purpose (see AI_HANDOFF.md Section 4).
    """
    return email.strip().lower()


def login(
    db_session: Session,
    email: str,
    password: str,
    *,
    remember_me: bool = False,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> LoginResult:
    """Authenticate a user and issue a new session + access token.

    Raises InvalidCredentialsError if the email doesn't exist or the
    password is wrong - identically, by design, so the two cases are
    indistinguishable to the caller.
    """
    normalized_email = _normalize_email(email)

    user = db_session.scalar(
        select(User).where(User.email == normalized_email)
    )

    if user is None:
        # No such user: still perform a password verification against
        # a fixed dummy hash so this path's timing is close to the
        # "user exists, wrong password" path below. The result is
        # discarded - we're paying the cost, not using the outcome.
        password_service.verify_password(password, _DUMMY_PASSWORD_HASH)
        raise InvalidCredentialsError

    if user.deleted_at is not None:
        # Soft-deleted accounts are not active accounts. deleted_at IS
        # NULL is the established definition of "active" throughout
        # this schema (see User model docstring) - auth_service is the
        # layer that decides whether authentication succeeds, so this
        # check belongs here, not in a model or another service. Same
        # uniform failure and same timing treatment as a nonexistent
        # user, so a caller can't distinguish "deleted" from "never
        # existed" from "wrong password."
        password_service.verify_password(password, _DUMMY_PASSWORD_HASH)
        raise InvalidCredentialsError

    user_password = db_session.get(UserPassword, user.id)

    # A User row without a matching UserPassword row would itself be
    # a data-integrity bug (every user should have exactly one), but
    # we don't want an unrelated integrity issue to surface as a 500
    # here - it still just means "can't authenticate this user."
    if user_password is None:
        password_service.verify_password(password, _DUMMY_PASSWORD_HASH)
        raise InvalidCredentialsError

    is_valid, upgraded_hash = password_service.verify_password(
        password, user_password.password_hash
    )

    if not is_valid:
        raise InvalidCredentialsError

    if upgraded_hash is not None:
        # Opportunistic rehash: verify_password only returns a value
        # here when the password was valid AND the stored hash's
        # parameters are stale (see password_service docstring). This
        # is best-effort persistence of the stronger hash, not a
        # second authentication gate - a failure to persist it isn't
        # itself an authentication failure, and login proceeds either
        # way. Committed separately from session creation below so a
        # failure in create_session() doesn't roll back a legitimate
        # hash upgrade that already succeeded.
        user_password.password_hash = upgraded_hash
        db_session.commit()

    session, refresh_token = session_service.create_session(
        db_session,
        user,
        remember_me=remember_me,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    # JWT is only created after the session row is committed - see
    # AI_HANDOFF.md Section 4 for why the ordering matters.
    access_token = token_service.create_access_token(
        user.id, session.id, user.role, user.school_id
    )

    return LoginResult(
        user=user,
        access_token=access_token,
        refresh_token=refresh_token,
    )


@dataclass(frozen=True)
class RefreshResult:
    """Everything a caller needs after a successful refresh.

    Structurally identical to LoginResult today, but kept as a
    separate type deliberately - login and refresh are different
    domain events, and each is free to grow event-specific fields
    later (e.g. LoginResult.must_change_password, RefreshResult
    rotation diagnostics) without coupling unrelated APIs.
    """

    user: User
    access_token: str
    refresh_token: str


class InvalidRefreshTokenError(Exception):
    """Raised when a refresh token is missing, revoked, expired, or
    belongs to a soft-deleted user.

    Deliberately distinct from InvalidCredentialsError: login and
    refresh are different failure domains (refresh never involves a
    password), and a route handler will likely want to respond to
    them differently (e.g. redirect to full login vs. show a login
    error).
    """


def refresh(db_session: Session, refresh_token: str) -> RefreshResult:
    """Rotates a refresh token and issues a new access token for the
    session it belongs to.

    Proves possession of a valid, active refresh token - this is NOT
    re-authentication with a password, so UserPassword is never
    consulted here. A missing/corrupted UserPassword row must not
    invalidate an otherwise-valid session.

    Raises InvalidRefreshTokenError if the token doesn't match an
    active session (nonexistent/revoked/expired - collapsed into one
    outcome by session_service, same philosophy as
    InvalidCredentialsError) or if the session's owning user has been
    soft-deleted.
    """
    session = session_service.get_active_session_by_refresh_token(
        db_session, refresh_token
    )

    if session is None:
        raise InvalidRefreshTokenError

    user = session.user

    if user.deleted_at is not None:
        # Defense in depth: a session created before a soft-delete
        # would otherwise keep refreshing forever, since
        # get_active_session_by_refresh_token only checks
        # revoked_at/expires_at, not the owning user's account state.
        # This is auth_service's call, not session_service's -
        # session_service owns session state, not whether a User
        # should still be allowed to authenticate.
        raise InvalidRefreshTokenError

    new_refresh_token = session_service.rotate_refresh_token(db_session, session)

    # JWT minted only after rotation commits - same "never mint a
    # credential referencing state that failed to persist" principle
    # as login().
    access_token = token_service.create_access_token(
        user.id, session.id, user.role, user.school_id
    )

    return RefreshResult(
        user=user,
        access_token=access_token,
        refresh_token=new_refresh_token,
    )


def logout(db_session: Session, refresh_token: str) -> None:
    """Revokes the session backing a refresh token.

    Raises InvalidRefreshTokenError if the token doesn't match an
    active session - this reuses the exact same collapsed lookup
    refresh() relies on (nonexistent/already-revoked/expired all look
    identical), rather than introducing separate no-op handling here.
    The operation itself is idempotent at the session-state level (a
    revoked session stays revoked), but the supplied credential is no
    longer valid either way, so the caller is told that plainly. Route
    layer, not built yet, can choose to still return a success status
    to the client on this error, since "you are logged out" is true
    regardless - that's an HTTP-layer idempotency concern, not an
    auth_service one.

    No JWT is decoded or required here - logout operates purely on
    the refresh token / session, matching refresh()'s security model
    rather than trusting a client-supplied session id or access token.
    """
    session = session_service.get_active_session_by_refresh_token(
        db_session, refresh_token
    )

    if session is None:
        raise InvalidRefreshTokenError

    session_service.revoke_session(db_session, session)


def logout_all(db_session: Session, user: User) -> None:
    """Revokes every active session belonging to a user.

    Unlike login/refresh/logout, this is inherently an authenticated
    action - "log out of every device" only makes sense once the
    caller already knows who is asking. The route layer (not built
    yet) will have already resolved a User via get_current_user (not
    built yet) before calling this, so this takes the User directly
    rather than performing a redundant second lookup by token.

    Delegates entirely to session_service.revoke_all_sessions, which
    is already idempotent (safe to call with zero active sessions).
    """
    session_service.revoke_all_sessions(db_session, user)
