"""Cookie helpers for the /auth/* routes.

Single source of truth for every cookie attribute (name, HttpOnly,
SameSite, Secure, path, domain, max_age), so no route embeds its own
repeated response.set_cookie(...) call with a duplicated copy of
these values. Consumes app.core.config.Settings exclusively - no
literals duplicated here.
"""

from fastapi import Response

from app.core.config import get_settings


def set_auth_cookies(
    response: Response,
    *,
    access_token: str,
    refresh_token: str,
    remember_me: bool,
) -> None:
    """Sets both the access and refresh token cookies on a response.

    Access token cookie lifetime never changes with remember_me - it
    mirrors JWT expiry, intentionally short-lived regardless of
    session lifetime. Only the refresh cookie's lifetime responds to
    remember_me, matching how session_service already treats
    remember_me as a session-lifetime concern, never a JWT concern.
    """
    settings = get_settings()

    refresh_lifetime = (
        settings.remember_me_session_lifetime
        if remember_me
        else settings.session_lifetime
    )

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
        max_age=int(refresh_lifetime.total_seconds()),
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
