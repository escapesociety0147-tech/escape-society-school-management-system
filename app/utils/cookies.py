"""Cookie helpers for the /auth/* routes.

Single source of truth for every cookie attribute (name, HttpOnly,
SameSite, Secure, path, domain, max_age), so no route embeds its own
repeated response.set_cookie(...) call with a duplicated copy of
these values. Consumes app.core.config.Settings exclusively - no
literals duplicated here.
"""

from datetime import datetime, timezone

from fastapi import Response

from app.core.config import get_settings
from app.models.user_session import UserSession


def set_auth_cookies(
    response: Response,
    *,
    access_token: str,
    refresh_token: str,
    remember_me: bool = False,
    session: UserSession | None = None,
) -> None:
    """Sets both the access and refresh token cookies on a response.

    Access token cookie lifetime never changes with remember_me - it
    mirrors JWT expiry, intentionally short-lived regardless of
    session lifetime. Only the refresh cookie's lifetime responds to
    session expiration or remember_me.
    """
    settings = get_settings()

    if session is not None:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        remaining = (session.expires_at - now).total_seconds()
        refresh_max_age = max(0, int(remaining))
    else:
        refresh_lifetime = (
            settings.remember_me_session_lifetime
            if remember_me
            else settings.session_lifetime
        )
        refresh_max_age = int(refresh_lifetime.total_seconds())

    response.set_cookie(
        key=settings.ACCESS_TOKEN_COOKIE_NAME,
        value=access_token,
        max_age=int(settings.access_token_expires_delta.total_seconds()),
        httponly=settings.SESSION_COOKIE_HTTPONLY,
        secure=settings.cookie_secure,
        samesite=settings.SESSION_COOKIE_SAMESITE.value,
        path=settings.SESSION_COOKIE_PATH,
        domain=settings.SESSION_COOKIE_DOMAIN,
    )

    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        value=refresh_token,
        max_age=refresh_max_age,
        httponly=settings.SESSION_COOKIE_HTTPONLY,
        secure=settings.cookie_secure,
        samesite=settings.SESSION_COOKIE_SAMESITE.value,
        path=settings.SESSION_COOKIE_PATH,
        domain=settings.SESSION_COOKIE_DOMAIN,
    )


def clear_auth_cookies(response: Response) -> None:
    """Clears both auth cookies on a response.

    Safe to call unconditionally, including when neither cookie was
    ever set - deleting an absent cookie is a client-side no-op.
    """
    settings = get_settings()

    response.delete_cookie(
        key=settings.ACCESS_TOKEN_COOKIE_NAME,
        path=settings.SESSION_COOKIE_PATH,
        domain=settings.SESSION_COOKIE_DOMAIN,
        secure=settings.cookie_secure,
        httponly=settings.SESSION_COOKIE_HTTPONLY,
        samesite=settings.SESSION_COOKIE_SAMESITE.value,
    )
    response.delete_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        path=settings.SESSION_COOKIE_PATH,
        domain=settings.SESSION_COOKIE_DOMAIN,
        secure=settings.cookie_secure,
        httponly=settings.SESSION_COOKIE_HTTPONLY,
        samesite=settings.SESSION_COOKIE_SAMESITE.value,
    )
