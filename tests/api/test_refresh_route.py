"""
Integration tests for POST /api/v1/auth/refresh.

Uses the client fixture (TestClient with get_db overridden to the
db_session fixture), matching this project's real-database,
no-mocking testing philosophy. These tests exercise the full HTTP path:
request with refresh cookie -> route -> auth_service.refresh() ->
token rotation -> new cookies.
"""

from datetime import timedelta

from app.core.config import get_settings
from app.models.user_session import UserSession
from app.services import token_service
from app.services.session_service import _utc_now, create_session, revoke_session
from tests.factories import create_school, create_user, create_user_password

VALID_PASSWORD = "correct-horse-battery-staple"


def _set_cookie_headers(response) -> list[str]:
    """Raw Set-Cookie header strings to inspect HttpOnly / cookie attributes."""
    return response.headers.get_list("set-cookie")


def test_refresh_returns_user_and_rotates_cookies(client, db_session):
    settings = get_settings()
    school = create_school(db_session, "SCH-REF001")
    user = create_user(db_session, school.id, "routerefresh@example.com")
    create_user_password(db_session, user.id)

    # Step 1: Login to get initial cookies
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "routerefresh@example.com", "password": VALID_PASSWORD},
    )
    assert login_response.status_code == 200
    initial_refresh_token = login_response.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)
    assert initial_refresh_token is not None

    # Step 2: Call /refresh with the refresh token cookie
    refresh_response = client.post(
        "/api/v1/auth/refresh",
        cookies={settings.REFRESH_TOKEN_COOKIE_NAME: initial_refresh_token},
    )

    assert refresh_response.status_code == 200

    body = refresh_response.json()
    assert set(body.keys()) == {"user"}
    assert body["user"]["id"] == str(user.id)
    assert body["user"]["school_id"] == str(school.id)
    assert body["user"]["email"] == "routerefresh@example.com"
    assert body["user"]["name"] == user.name
    assert body["user"]["role"] == user.role.value

    # Tokens never in JSON body
    assert "access_token" not in str(body)
    assert "refresh_token" not in str(body)

    # Step 3: Verify new cookies
    new_access_token = refresh_response.cookies.get(settings.ACCESS_TOKEN_COOKIE_NAME)
    new_refresh_token = refresh_response.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)

    assert new_access_token is not None
    assert new_refresh_token is not None
    assert new_refresh_token != initial_refresh_token

    # Verify access token claims
    claims = token_service.decode_access_token(new_access_token)
    assert claims["sub"] == str(user.id)
    assert claims["role"] == user.role.value
    assert claims["school_id"] == str(school.id)
    assert "sid" in claims

    # Step 4: Verify old refresh token is invalidated immediately by rotation
    stale_response = client.post(
        "/api/v1/auth/refresh",
        cookies={settings.REFRESH_TOKEN_COOKIE_NAME: initial_refresh_token},
    )
    assert stale_response.status_code == 401
    assert stale_response.json() == {"detail": "Invalid refresh token"}


def test_refresh_rejects_missing_cookie(client, db_session):
    response = client.post("/api/v1/auth/refresh")

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid refresh token"}
    assert _set_cookie_headers(response) == []


def test_refresh_rejects_invalid_token(client, db_session):
    settings = get_settings()
    response = client.post(
        "/api/v1/auth/refresh",
        cookies={settings.REFRESH_TOKEN_COOKIE_NAME: "not-a-valid-refresh-token"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid refresh token"}
    assert _set_cookie_headers(response) == []


def test_refresh_rejects_revoked_session(client, db_session):
    settings = get_settings()
    school = create_school(db_session, "SCH-REF002")
    user = create_user(db_session, school.id, "revokedrefresh-rt@example.com")
    create_user_password(db_session, user.id)

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "revokedrefresh-rt@example.com", "password": VALID_PASSWORD},
    )
    refresh_token = login_response.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)

    # Revoke the session directly
    session = db_session.query(UserSession).filter(UserSession.user_id == user.id).one()
    revoke_session(db_session, session)

    response = client.post(
        "/api/v1/auth/refresh",
        cookies={settings.REFRESH_TOKEN_COOKIE_NAME: refresh_token},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid refresh token"}


def test_refresh_rejects_expired_session(client, db_session):
    settings = get_settings()
    school = create_school(db_session, "SCH-REF003")
    user = create_user(db_session, school.id, "expiredrefresh-rt@example.com")
    create_user_password(db_session, user.id)

    expired_session, expired_token = create_session(db_session, user)
    expired_session.expires_at = _utc_now() - timedelta(minutes=1)
    db_session.commit()

    response = client.post(
        "/api/v1/auth/refresh",
        cookies={settings.REFRESH_TOKEN_COOKIE_NAME: expired_token},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid refresh token"}


def test_refresh_rejects_soft_deleted_user(client, db_session):
    settings = get_settings()
    school = create_school(db_session, "SCH-REF004")
    user = create_user(db_session, school.id, "deletedrefresh-rt@example.com")
    create_user_password(db_session, user.id)

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "deletedrefresh-rt@example.com", "password": VALID_PASSWORD},
    )
    refresh_token = login_response.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)

    # Soft-delete user after session creation
    user.deleted_at = _utc_now()
    db_session.commit()

    response = client.post(
        "/api/v1/auth/refresh",
        cookies={settings.REFRESH_TOKEN_COOKIE_NAME: refresh_token},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid refresh token"}
