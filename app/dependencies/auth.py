"""FastAPI dependency for resolving the authenticated user from the
access token cookie.

This module is where HTTP concerns (Request, cookies, HTTPException)
are allowed to exist - deliberately kept out of auth_service,
token_service, and session_service, which all stay framework-agnostic.
This is the translation boundary between "a raw HTTP request came in"
and "here is the User making it."

This module does NOT:
- verify passwords or handle login/refresh/logout flows (auth_service)
- perform authorization, role checks, or school-membership checks
  (future, separate dependencies - e.g. require_school_admin)
- expose which specific thing went wrong (expired token vs. revoked
  session vs. deleted user) - every failure here is the same 401
"""

from typing import NoReturn
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from jwt.exceptions import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User
from app.services import session_service, token_service


def _unauthorized() -> NoReturn:
    """Single point of construction for every auth failure in this
    module, so every rejection path returns byte-for-byte the same
    response - no distinguishing signal for a client to learn from.
    """
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )


def get_current_user(
    request: Request,
    db_session: Session = Depends(get_db),
) -> User:
    """Resolves the User making the current request from the access
    token cookie.

    Answers exactly one question: who is authenticated. Does not
    return the session - a future get_current_session() dependency
    should be added separately if an endpoint needs that, rather than
    expanding this one's return type.
    """
    settings = get_settings()
    token = request.cookies.get(settings.ACCESS_TOKEN_COOKIE_NAME)

    if not token:
        _unauthorized()

    try:
        payload = token_service.decode_access_token(token)
    except InvalidTokenError:
        _unauthorized()

    sid_claim = payload.get("sid")
    sub_claim = payload.get("sub")

    if sid_claim is None or sub_claim is None:
        _unauthorized()

    try:
        session_id = UUID(sid_claim)
        user_id = UUID(sub_claim)
    except ValueError:
        _unauthorized()

    session = session_service.get_active_session_by_id(db_session, session_id)

    if session is None:
        _unauthorized()

    # Defense in depth: the JWT claims a specific user (sub) for a
    # specific session (sid). If those ever disagreed - which should
    # only be reachable via a signing-key compromise or an application
    # bug, since the token is signature-verified above - reject it
    # rather than trusting either claim in isolation.
    if session.user_id != user_id:
        _unauthorized()

    user = session.user

    # Should be unreachable under normal operation (user_id is a
    # non-nullable FK with ON DELETE CASCADE), but authentication code
    # fails closed rather than assuming referential integrity holds.
    if user is None:
        _unauthorized()

    if user.deleted_at is not None:
        _unauthorized()

    return user
