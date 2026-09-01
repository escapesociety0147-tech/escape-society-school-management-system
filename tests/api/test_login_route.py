"""
Integration tests for POST /api/v1/auth/login.

Uses the client fixture (TestClient with get_db overridden to the
db_session fixture), matching this project's real-database,
no-mocking testing philosophy. These tests exercise the full stack -
HTTP request in, real auth_service.login() call, real cookie
attributes out - the same way test_auth_service.py exercises
auth_service directly, one layer down.

client and db_session are requested together in each test: pytest
caches fixture instances per test, so both resolve to the same
db_session - the route (via the client fixture's dependency override)
and the test's own setup/assertions share one transaction.
"""

from app.core.config import get_settings
from app.services import token_service
from tests.factories import create_school, create_user, create_user_password

VALID_PASSWORD = "correct-horse-battery-staple"


def _set_cookie_headers(response) -> list[str]:
    """Raw Set-Cookie header strings - the only way to see HttpOnly,
    SameSite, and Max-Age, since httpx's parsed cookie jar drops
    those attributes (they're script-invisible by design)."""
    return response.headers.get_list("set-cookie")


def test_login_returns_user_and_sets_auth_cookies(client, db_session):
    settings = get_settings()
    school = create_school(db_session, "SCH-RT0001")
    user = create_user(db_session, school.id, "routelogin@example.com")
    create_user_password(db_session, user.id)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "routelogin@example.com", "password": VALID_PASSWORD},
    )

    assert response.status_code == 200

    body = response.json()
    assert set(body.keys()) == {"user"}
    assert body["user"]["id"] == str(user.id)
    assert body["user"]["school_id"] == str(school.id)
    assert body["user"]["email"] == "routelogin@example.com"
    assert body["user"]["name"] == user.name
    assert body["user"]["role"] == user.role.value

    # No token anywhere in the JSON body - they exist exclusively as
    # cookies, per the architecture decision.
    assert "access_token" not in str(body)
    assert "refresh_token" not in str(body)

    set_cookie_headers = _set_cookie_headers(response)
    assert len(set_cookie_headers) == 2

    access_header = next(
        h for h in set_cookie_headers if h.startswith(f"{settings.ACCESS_TOKEN_COOKIE_NAME}=")
    )
    refresh_header = next(
        h for h in set_cookie_headers if h.startswith(f"{settings.REFRESH_TOKEN_COOKIE_NAME}=")
    )

    assert "HttpOnly" in access_header
    assert "HttpOnly" in refresh_header

    access_token = response.cookies.get(settings.ACCESS_TOKEN_COOKIE_NAME)
    refresh_token = response.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)
    assert access_token
    assert refresh_token

    # Confirm the route wires auth_service's output through unchanged,
    # rather than accidentally modifying or swapping tokens.
    claims = token_service.decode_access_token(access_token)
    assert claims["sub"] == str(user.id)
    assert claims["role"] == user.role.value
    assert claims["school_id"] == str(school.id)
    assert "sid" in claims


def test_login_rejects_wrong_password(client, db_session):
    school = create_school(db_session, "SCH-RT0002")
    user = create_user(db_session, school.id, "wrongpw@example.com")
    create_user_password(db_session, user.id)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpw@example.com", "password": "not-the-right-password"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}
    assert _set_cookie_headers(response) == []


def test_login_rejects_unknown_email(client, db_session):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": VALID_PASSWORD},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}
    assert _set_cookie_headers(response) == []


def test_login_rejects_soft_deleted_user(client, db_session):
    school = create_school(db_session, "SCH-RT0004")
    user = create_user(db_session, school.id, "routedeleted@example.com", deleted=True)
    create_user_password(db_session, user.id)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "routedeleted@example.com", "password": VALID_PASSWORD},
    )

    # Byte-for-byte identical to the wrong-password and unknown-email
    # cases - preserves the non-enumeration guarantee auth_service was
    # deliberately designed with.
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password"}
    assert _set_cookie_headers(response) == []


def test_login_sets_extended_refresh_cookie_when_remember_me_enabled(client, db_session):
    settings = get_settings()

    school = create_school(db_session, "SCH-RT0005")
    user_normal = create_user(db_session, school.id, "remembernormal@example.com")
    create_user_password(db_session, user_normal.id)
    user_remember = create_user(db_session, school.id, "rememberme@example.com")
    create_user_password(db_session, user_remember.id)

    response_normal = client.post(
        "/api/v1/auth/login",
        json={
            "email": "remembernormal@example.com",
            "password": VALID_PASSWORD,
            "remember_me": False,
        },
    )
    response_remember = client.post(
        "/api/v1/auth/login",
        json={
            "email": "rememberme@example.com",
            "password": VALID_PASSWORD,
            "remember_me": True,
        },
    )

    def _refresh_cookie_max_age(response) -> int:
        header = next(
            h
            for h in _set_cookie_headers(response)
            if h.startswith(f"{settings.REFRESH_TOKEN_COOKIE_NAME}=")
        )
        # Max-Age=<seconds>; ... - pull the integer out.
        for part in header.split(";"):
            part = part.strip()
            if part.lower().startswith("max-age="):
                return int(part.split("=", 1)[1])
        raise AssertionError(f"no Max-Age found in refresh cookie header: {header!r}")

    normal_max_age = _refresh_cookie_max_age(response_normal)
    remember_max_age = _refresh_cookie_max_age(response_remember)

    expected_normal = int(settings.session_lifetime.total_seconds())
    expected_remember = int(settings.remember_me_session_lifetime.total_seconds())

    assert normal_max_age == expected_normal
    assert remember_max_age == expected_remember
    assert remember_max_age > normal_max_age
