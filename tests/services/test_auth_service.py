"""
Integration tests for the auth service's login() and refresh() flows.

Uses the db_session fixture (savepoint-based rollback), matching
test_session_service.py's convention. auth_service composes
password_service, session_service, and token_service against real
rows - mocking those collaborators would mostly verify that mocks
were called, not that the composition is correct, so these tests
exercise the real stack the same way test_session_service.py does.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.config import get_settings
from app.models.school import School
from app.models.user import User, UserRole
from app.models.user_password import UserPassword
from app.models.user_session import UserSession
from app.services import password_service, token_service
from app.services.auth_service import (
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    login,
    refresh,
)
from app.services.session_service import _utc_now, create_session, revoke_session

VALID_PASSWORD = "correct-horse-battery-staple"


def create_school(db_session, school_code: str) -> School:
    """Creates and commits a fully-populated, valid School."""
    school = School(
        school_code=school_code,
        name=f"Test School {school_code}",
        type="Secondary",
        established_year=2000,
        address="123 Test Street",
        city="Lagos",
        state="Lagos",
        country="Nigeria",
        postal_code="100001",
        email=f"{school_code.lower()}@example.com",
        phone="+2348000000000",
        website="https://example.com",
        academic_board="WAEC",
        medium_of_instruction="English",
        classes_offered=["Grade 1", "Grade 2"],
    )
    db_session.add(school)
    db_session.commit()
    return school


def create_user(db_session, school_id, email: str, *, deleted=False) -> User:
    """Creates and commits a User for auth_service tests to attach to."""
    user = User(school_id=school_id, email=email, name="Test User", role=UserRole.ADMIN)
    if deleted:
        user.deleted_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db_session.add(user)
    db_session.commit()
    return user


def create_user_password(db_session, user_id, *, password: str = VALID_PASSWORD) -> UserPassword:
    """Creates and commits a UserPassword row with a real Argon2id hash."""
    user_password = UserPassword(
        user_id=user_id,
        password_hash=password_service.hash_password(password),
    )
    db_session.add(user_password)
    db_session.commit()
    return user_password


def _session_count(db_session, user_id) -> int:
    return len(
        db_session.scalars(
            select(UserSession).where(UserSession.user_id == user_id)
        ).all()
    )


def test_login_returns_access_and_refresh_tokens(db_session):
    school = create_school(db_session, "SCH-AS0001")
    user = create_user(db_session, school.id, "returns@example.com")
    create_user_password(db_session, user.id)

    result = login(db_session, "returns@example.com", VALID_PASSWORD)

    assert result.user.id == user.id
    assert isinstance(result.access_token, str) and result.access_token
    assert isinstance(result.refresh_token, str) and result.refresh_token

    claims = token_service.decode_access_token(result.access_token)
    assert claims["sub"] == str(user.id)
    assert claims["role"] == UserRole.ADMIN.value
    assert claims["school_id"] == str(school.id)


def test_login_creates_session_row(db_session):
    school = create_school(db_session, "SCH-AS0002")
    user = create_user(db_session, school.id, "createssession@example.com")
    create_user_password(db_session, user.id)

    assert _session_count(db_session, user.id) == 0

    result = login(db_session, "createssession@example.com", VALID_PASSWORD)

    sessions = db_session.scalars(
        select(UserSession).where(UserSession.user_id == user.id)
    ).all()
    assert len(sessions) == 1

    claims = token_service.decode_access_token(result.access_token)
    assert claims["sid"] == str(sessions[0].id)


def test_login_updates_nothing_on_failed_password(db_session):
    school = create_school(db_session, "SCH-AS0003")
    user = create_user(db_session, school.id, "failedpw@example.com")
    create_user_password(db_session, user.id)

    assert _session_count(db_session, user.id) == 0

    try:
        login(db_session, "failedpw@example.com", "wrong-password")
        assert False, "expected InvalidCredentialsError"
    except InvalidCredentialsError:
        pass

    assert _session_count(db_session, user.id) == 0


def test_login_fails_for_unknown_email(db_session):
    try:
        login(db_session, "nobody@example.com", VALID_PASSWORD)
        assert False, "expected InvalidCredentialsError"
    except InvalidCredentialsError:
        pass


def test_login_fails_for_soft_deleted_user(db_session):
    school = create_school(db_session, "SCH-AS0005")
    user = create_user(db_session, school.id, "deleted@example.com", deleted=True)
    create_user_password(db_session, user.id)

    try:
        login(db_session, "deleted@example.com", VALID_PASSWORD)
        assert False, "expected InvalidCredentialsError"
    except InvalidCredentialsError:
        pass

    assert _session_count(db_session, user.id) == 0


def test_login_fails_when_password_row_missing(db_session):
    school = create_school(db_session, "SCH-AS0006")
    create_user(db_session, school.id, "nopasswordrow@example.com")
    # Deliberately no create_user_password() call.

    try:
        login(db_session, "nopasswordrow@example.com", VALID_PASSWORD)
        assert False, "expected InvalidCredentialsError"
    except InvalidCredentialsError:
        pass


def test_login_honors_remember_me(db_session):
    school = create_school(db_session, "SCH-AS0007")
    user = create_user(db_session, school.id, "rememberme@example.com")
    create_user_password(db_session, user.id)
    settings = get_settings()

    login(db_session, "rememberme@example.com", VALID_PASSWORD, remember_me=True)

    session = db_session.scalars(
        select(UserSession).where(UserSession.user_id == user.id)
    ).one()

    # Same tolerance pattern used in test_session_service.py: MySQL
    # DATETIME rounds to the nearest second, so an exact-microsecond
    # comparison would be flaky.
    default_minutes = settings.SESSION_LIFETIME_MINUTES
    remember_me_minutes = settings.REMEMBER_ME_SESSION_LIFETIME_MINUTES
    assert remember_me_minutes > default_minutes

    now = _utc_now().replace(microsecond=0)
    assert session.expires_at > now + timedelta(minutes=default_minutes)


def test_login_persists_ip_address_and_user_agent(db_session):
    school = create_school(db_session, "SCH-AS0008")
    user = create_user(db_session, school.id, "ipandagent@example.com")
    create_user_password(db_session, user.id)

    login(
        db_session,
        "ipandagent@example.com",
        VALID_PASSWORD,
        ip_address="203.0.113.10",
        user_agent="pytest-suite/1.0",
    )

    session = db_session.scalars(
        select(UserSession).where(UserSession.user_id == user.id)
    ).one()

    assert session.ip_address == "203.0.113.10"
    assert session.user_agent == "pytest-suite/1.0"


def test_login_rehashes_stale_password_hash(db_session, monkeypatch):
    """
    Exercises the opportunistic-rehash branch in login().

    Unlike the rest of this file, this test monkeypatches
    password_service.verify_password rather than using a real stale
    hash. That's a deliberate exception, not a default: producing a
    genuinely stale Argon2id hash requires hashing with a second,
    older parameter set and there's no existing helper for that. The
    monkeypatch simulates exactly the (True, new_hash) return shape
    verify_password's own docstring documents, so this test still
    verifies login()'s handling of that contract, just not
    password_service's judgment of staleness itself (which
    test_password_service.py already covers separately, if it tests
    that at all - worth checking).
    """
    school = create_school(db_session, "SCH-AS0009")
    user = create_user(db_session, school.id, "rehash@example.com")
    user_password = create_user_password(db_session, user.id)
    original_hash = user_password.password_hash
    new_hash = "$argon2id$upgraded-hash-for-test$"

    def fake_verify_password(password, password_hash):
        return True, new_hash

    monkeypatch.setattr(
        "app.services.auth_service.password_service.verify_password",
        fake_verify_password,
    )

    login(db_session, "rehash@example.com", VALID_PASSWORD)

    db_session.refresh(user_password)
    assert user_password.password_hash == new_hash
    assert user_password.password_hash != original_hash


def test_refresh_returns_new_tokens_for_same_session(db_session):
    school = create_school(db_session, "SCH-AS0010")
    user = create_user(db_session, school.id, "refreshbasic@example.com")
    create_user_password(db_session, user.id)
    login_result = login(db_session, "refreshbasic@example.com", VALID_PASSWORD)

    session = db_session.scalars(
        select(UserSession).where(UserSession.user_id == user.id)
    ).one()

    result = refresh(db_session, login_result.refresh_token)

    assert result.user.id == user.id
    assert result.refresh_token != login_result.refresh_token

    # The access token's serialized string is NOT required to differ
    # from the one login() issued: JWT signing is deterministic, and
    # login()/refresh() can legitimately produce identical claims
    # (same sub/sid/role/school_id/iat/exp) when run within the same
    # wall-clock second. The actual contract is that the token is
    # valid, correctly signed, and references the correct session -
    # not that its string representation is unique per mint. Per-token
    # uniqueness (a jti claim) is deliberately not implemented: this
    # architecture's revocable security object is the session (sid),
    # not the access token, and nothing today consumes a jti.
    claims = token_service.decode_access_token(result.access_token)
    assert claims["sub"] == str(user.id)
    assert claims["sid"] == str(session.id)
    assert claims["role"] == user.role.value
    assert claims["school_id"] == str(user.school_id)

    # Still exactly one session row - refresh rotates the existing
    # session, it does not create a new one.
    assert _session_count(db_session, user.id) == 1


def test_refresh_rotation_invalidates_old_refresh_token(db_session):
    school = create_school(db_session, "SCH-AS0011")
    user = create_user(db_session, school.id, "rotateinvalidate@example.com")
    create_user_password(db_session, user.id)
    login_result = login(db_session, "rotateinvalidate@example.com", VALID_PASSWORD)

    refresh(db_session, login_result.refresh_token)

    try:
        refresh(db_session, login_result.refresh_token)
        assert False, "expected InvalidRefreshTokenError on reuse of a rotated token"
    except InvalidRefreshTokenError:
        pass


def test_refresh_fails_for_unknown_token(db_session):
    try:
        refresh(db_session, "not-a-real-refresh-token")
        assert False, "expected InvalidRefreshTokenError"
    except InvalidRefreshTokenError:
        pass


def test_refresh_fails_for_revoked_session(db_session):
    school = create_school(db_session, "SCH-AS0012")
    user = create_user(db_session, school.id, "revokedrefresh@example.com")
    create_user_password(db_session, user.id)
    login_result = login(db_session, "revokedrefresh@example.com", VALID_PASSWORD)

    session = db_session.scalars(
        select(UserSession).where(UserSession.user_id == user.id)
    ).one()
    revoke_session(db_session, session)

    try:
        refresh(db_session, login_result.refresh_token)
        assert False, "expected InvalidRefreshTokenError"
    except InvalidRefreshTokenError:
        pass


def test_refresh_fails_for_expired_session(db_session):
    """
    Constructs the session directly with an already-past expires_at,
    same approach test_session_service.py uses for its own expiry
    test - bypasses login()/create_session() since neither exposes an
    expires_at override, and this test targets refresh()'s handling
    of an expired session, not lifetime-calculation logic (already
    covered by test_login_honors_remember_me and
    test_create_session_uses_default_lifetime_when_not_remember_me).
    """
    school = create_school(db_session, "SCH-AS0013")
    user = create_user(db_session, school.id, "expiredrefresh@example.com")
    create_user_password(db_session, user.id)

    expired_session, expired_token = create_session(db_session, user)
    expired_session.expires_at = _utc_now() - timedelta(minutes=1)
    db_session.commit()

    try:
        refresh(db_session, expired_token)
        assert False, "expected InvalidRefreshTokenError"
    except InvalidRefreshTokenError:
        pass


def test_refresh_fails_for_soft_deleted_user(db_session):
    school = create_school(db_session, "SCH-AS0014")
    user = create_user(db_session, school.id, "deletedrefresh@example.com")
    create_user_password(db_session, user.id)
    login_result = login(db_session, "deletedrefresh@example.com", VALID_PASSWORD)

    # Soft-delete the user AFTER the session already exists - this is
    # the exact scenario the deleted_at check in refresh() defends
    # against: a session created while active, then the account is
    # removed, and refresh must not keep extending access.
    user.deleted_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db_session.commit()

    try:
        refresh(db_session, login_result.refresh_token)
        assert False, "expected InvalidRefreshTokenError"
    except InvalidRefreshTokenError:
        pass


def test_refresh_does_not_require_a_password_row(db_session):
    """
    Proves refresh() never consults UserPassword: deletes the
    UserPassword row after login and confirms refresh still succeeds.
    This is the design decision that refresh proves possession of the
    refresh token, not re-authentication with a password - deleting a
    password row must not invalidate an otherwise-valid session.
    """
    school = create_school(db_session, "SCH-AS0015")
    user = create_user(db_session, school.id, "nopasswordrefresh@example.com")
    user_password = create_user_password(db_session, user.id)
    login_result = login(db_session, "nopasswordrefresh@example.com", VALID_PASSWORD)

    db_session.delete(user_password)
    db_session.commit()

    result = refresh(db_session, login_result.refresh_token)

    assert result.user.id == user.id
    assert isinstance(result.access_token, str) and result.access_token
