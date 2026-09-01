"""
Integration tests for POST /api/v1/auth/logout and POST /api/v1/auth/logout-all.

Uses the client fixture (TestClient with get_db overridden to the
db_session fixture), matching this project's real-database,
no-mocking testing philosophy.
"""

from sqlalchemy import select

from app.core.config import get_settings
from app.models.user_session import UserSession
from tests.factories import create_school, create_user, create_user_password

VALID_PASSWORD = "correct-horse-battery-staple"


def _session_count_active(db_session, user_id) -> int:
    return len(
        db_session.scalars(
            select(UserSession).where(
                UserSession.user_id == user_id,
                UserSession.revoked_at.is_(None),
            )
        ).all()
    )


# ── POST /auth/logout ─────────────────────────────────────────────────────────


def test_logout_revokes_session_and_clears_cookies(client, db_session):
    settings = get_settings()
    school = create_school(db_session, "SCH-LOG001")
    user = create_user(db_session, school.id, "routelogout@example.com")
    create_user_password(db_session, user.id)

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "routelogout@example.com", "password": VALID_PASSWORD},
    )
    refresh_token = login_resp.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)
    assert refresh_token is not None

    logout_resp = client.post(
        "/api/v1/auth/logout",
        cookies={settings.REFRESH_TOKEN_COOKIE_NAME: refresh_token},
    )

    assert logout_resp.status_code == 200
    assert logout_resp.json() == {"message": "Successfully logged out"}

    # Verify session is marked revoked in DB
    session = db_session.scalars(
        select(UserSession).where(UserSession.user_id == user.id)
    ).one()
    assert session.revoked_at is not None

    # Verify deleted cookies in response headers
    set_cookie_headers = logout_resp.headers.get_list("set-cookie")
    assert any(settings.ACCESS_TOKEN_COOKIE_NAME in h for h in set_cookie_headers)
    assert any(settings.REFRESH_TOKEN_COOKIE_NAME in h for h in set_cookie_headers)


def test_logout_without_cookie_returns_200_and_clears_cookies(client, db_session):
    settings = get_settings()
    logout_resp = client.post("/api/v1/auth/logout")

    assert logout_resp.status_code == 200
    assert logout_resp.json() == {"message": "Successfully logged out"}

    set_cookie_headers = logout_resp.headers.get_list("set-cookie")
    assert any(settings.ACCESS_TOKEN_COOKIE_NAME in h for h in set_cookie_headers)
    assert any(settings.REFRESH_TOKEN_COOKIE_NAME in h for h in set_cookie_headers)


def test_logout_with_invalid_cookie_returns_200_and_clears_cookies(client, db_session):
    settings = get_settings()
    logout_resp = client.post(
        "/api/v1/auth/logout",
        cookies={settings.REFRESH_TOKEN_COOKIE_NAME: "not-a-valid-token"},
    )

    assert logout_resp.status_code == 200
    assert logout_resp.json() == {"message": "Successfully logged out"}

    set_cookie_headers = logout_resp.headers.get_list("set-cookie")
    assert any(settings.ACCESS_TOKEN_COOKIE_NAME in h for h in set_cookie_headers)
    assert any(settings.REFRESH_TOKEN_COOKIE_NAME in h for h in set_cookie_headers)


# ── POST /auth/logout-all ─────────────────────────────────────────────────────


def test_logout_all_revokes_all_sessions_for_user(client, db_session):
    settings = get_settings()
    school = create_school(db_session, "SCH-LOG002")
    user = create_user(db_session, school.id, "logoutall-rt@example.com")
    create_user_password(db_session, user.id)

    # 3 logins -> 3 active sessions
    client.post(
        "/api/v1/auth/login",
        json={"email": "logoutall-rt@example.com", "password": VALID_PASSWORD},
    )
    client.post(
        "/api/v1/auth/login",
        json={"email": "logoutall-rt@example.com", "password": VALID_PASSWORD},
    )
    last_login = client.post(
        "/api/v1/auth/login",
        json={"email": "logoutall-rt@example.com", "password": VALID_PASSWORD},
    )

    access_token = last_login.cookies.get(settings.ACCESS_TOKEN_COOKIE_NAME)
    assert access_token is not None
    assert _session_count_active(db_session, user.id) == 3

    logout_all_resp = client.post(
        "/api/v1/auth/logout-all",
        cookies={settings.ACCESS_TOKEN_COOKIE_NAME: access_token},
    )

    assert logout_all_resp.status_code == 200
    assert logout_all_resp.json() == {"message": "Successfully logged out of all devices"}
    assert _session_count_active(db_session, user.id) == 0


def test_logout_all_unauthenticated_returns_401(client, db_session):
    logout_all_resp = client.post("/api/v1/auth/logout-all")

    assert logout_all_resp.status_code == 401
    assert logout_all_resp.json() == {"detail": "Not authenticated"}


def test_logout_all_does_not_revoke_other_users_sessions(client, db_session):
    settings = get_settings()
    school = create_school(db_session, "SCH-LOG003")
    user_a = create_user(db_session, school.id, "logoutall-a@example.com")
    create_user_password(db_session, user_a.id)
    user_b = create_user(db_session, school.id, "logoutall-b@example.com")
    create_user_password(db_session, user_b.id)

    login_a = client.post(
        "/api/v1/auth/login",
        json={"email": "logoutall-a@example.com", "password": VALID_PASSWORD},
    )
    client.post(
        "/api/v1/auth/login",
        json={"email": "logoutall-b@example.com", "password": VALID_PASSWORD},
    )

    access_token_a = login_a.cookies.get(settings.ACCESS_TOKEN_COOKIE_NAME)

    client.post(
        "/api/v1/auth/logout-all",
        cookies={settings.ACCESS_TOKEN_COOKIE_NAME: access_token_a},
    )

    assert _session_count_active(db_session, user_a.id) == 0
    assert _session_count_active(db_session, user_b.id) == 1
