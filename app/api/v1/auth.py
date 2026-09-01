"""HTTP routes for authentication (/api/v1/auth/*).

This module is intentionally thin: parse request, call exactly one
auth_service function, translate its exceptions into HTTP responses,
set/clear cookies, shape the response body. No business logic here -
password verification, session creation, and JWT minting all live in
auth_service, which stays framework-agnostic.

If this module ever imports password_service, session_service, or
token_service directly, that's a design smell - it means logic that
belongs in auth_service leaked into the route layer.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, MessageResponse, UserResponse
from app.services.auth_service import (
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    login,
    logout,
    logout_all,
    refresh,
)
from app.utils.cookies import clear_auth_cookies, set_auth_cookies

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def login_route(
    payload: LoginRequest,
    response: Response,
    db_session: Session = Depends(get_db),
) -> LoginResponse:
    """Authenticates a user and sets access/refresh token cookies.

    Tokens never appear in the JSON body - they exist exclusively as
    HttpOnly cookies, set via set_auth_cookies(). Response body is the
    authenticated user only.
    """
    try:
        result = login(
            db_session,
            payload.email,
            payload.password,
            remember_me=payload.remember_me,
        )
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    set_auth_cookies(
        response=response,
        access_token=result.access_token,
        refresh_token=result.refresh_token,
        remember_me=payload.remember_me,
        session=result.session,
    )

    return LoginResponse(user=UserResponse.from_user(result.user))


@router.post("/refresh", response_model=LoginResponse, status_code=status.HTTP_200_OK)
def refresh_route(
    request: Request,
    response: Response,
    db_session: Session = Depends(get_db),
) -> LoginResponse:
    """Rotates a refresh token and sets new access/refresh cookies.

    Reads the refresh token from the esm_refresh_token cookie.
    Does not use get_current_user since the access token may be expired.
    Raises 401 with 'Invalid refresh token' if the cookie is missing,
    expired, revoked, or belongs to a soft-deleted user.
    """
    settings = get_settings()
    refresh_token = request.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    try:
        result = refresh(db_session, refresh_token)
    except InvalidRefreshTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    set_auth_cookies(
        response=response,
        access_token=result.access_token,
        refresh_token=result.refresh_token,
        session=result.session,
    )

    return LoginResponse(user=UserResponse.from_user(result.user))


@router.post("/logout", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def logout_route(
    request: Request,
    response: Response,
    db_session: Session = Depends(get_db),
) -> MessageResponse:
    """Revokes the current session and clears authentication cookies.

    Operates directly on the refresh token cookie. Idempotent at the HTTP
    boundary: if the cookie is missing or the server-side session is
    already revoked or expired, cookies are still cleared and 200 OK is
    returned so the client is always safely logged out.
    """
    settings = get_settings()
    refresh_token = request.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)

    if refresh_token:
        try:
            logout(db_session, refresh_token)
        except InvalidRefreshTokenError:
            pass

    clear_auth_cookies(response)
    return MessageResponse(message="Successfully logged out")


@router.post("/logout-all", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def logout_all_route(
    response: Response,
    current_user: User = Depends(get_current_user),
    db_session: Session = Depends(get_db),
) -> MessageResponse:
    """Revokes all active sessions for the authenticated user and clears cookies.

    Requires authentication via get_current_user.
    """
    logout_all(db_session, current_user)
    clear_auth_cookies(response)
    return MessageResponse(message="Successfully logged out of all devices")
