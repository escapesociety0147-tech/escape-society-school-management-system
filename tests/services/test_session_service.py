"""
Persistence tests for the session service.

Uses the db_session fixture (savepoint-based rollback), never raw
SessionLocal() - every test's data is automatically discarded, no manual
cleanup required. This is deliberately the pattern that was missing from
the ad-hoc manual verification script that hit a FK-ordering error
during cleanup.
"""

import uuid
from datetime import timedelta

from app.core.config import get_settings
from app.models.school import School
from app.models.user import User, UserRole
from app.models.user_session import UserSession
from app.services.session_service import (
    _hash_refresh_token,
    _utc_now,
    create_session,
    get_active_session_by_id,
    get_active_session_by_refresh_token,
    revoke_all_sessions,
    revoke_session,
    rotate_refresh_token,
)


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


def create_user(db_session, school_id, email: str) -> User:
    """Creates and commits a User for session service tests to attach to."""
    user = User(school_id=school_id, email=email, name="Test User", role=UserRole.ADMIN)
    db_session.add(user)
    db_session.commit()
    return user


def test_create_session_persists_and_returns_plaintext_token(db_session):
    school = create_school(db_session, "SCH-SS0001")
    user = create_user(db_session, school.id, "create@example.com")

    session, refresh_token = create_session(db_session, user)

    assert session.id is not None
    assert session.user_id == user.id
    assert isinstance(refresh_token, str)
    assert len(refresh_token) > 0

    fetched = db_session.get(UserSession, session.id)
    assert fetched is not None


def test_create_session_stores_only_hash_not_plaintext(db_session):
    school = create_school(db_session, "SCH-SS0002")
    user = create_user(db_session, school.id, "hashonly@example.com")

    session, refresh_token = create_session(db_session, user)

    assert session.refresh_token_hash != refresh_token
    assert session.refresh_token_hash == _hash_refresh_token(refresh_token)


def test_create_session_uses_default_lifetime_when_not_remember_me(db_session):
    school = create_school(db_session, "SCH-SS0003")
    user = create_user(db_session, school.id, "defaultlifetime@example.com")
    settings = get_settings()

    before = _utc_now().replace(microsecond=0)
    session, _ = create_session(db_session, user, remember_me=False)
    after = _utc_now().replace(microsecond=0) + timedelta(seconds=1)

    expected_minutes = settings.SESSION_LIFETIME_MINUTES
    assert before + timedelta(minutes=expected_minutes) <= session.expires_at
    assert session.expires_at <= after + timedelta(minutes=expected_minutes)


def test_create_session_uses_extended_lifetime_when_remember_me(db_session):
    school = create_school(db_session, "SCH-SS0004")
    user = create_user(db_session, school.id, "rememberme@example.com")
    settings = get_settings()

    before = _utc_now().replace(microsecond=0)
    session, _ = create_session(db_session, user, remember_me=True)
    after = _utc_now().replace(microsecond=0) + timedelta(seconds=1)

    expected_minutes = settings.REMEMBER_ME_SESSION_LIFETIME_MINUTES
    assert before + timedelta(minutes=expected_minutes) <= session.expires_at
    assert session.expires_at <= after + timedelta(minutes=expected_minutes)


def test_get_active_session_by_id_returns_none_for_nonexistent_session(db_session):
    assert get_active_session_by_id(db_session, uuid.uuid4()) is None


def test_get_active_session_by_id_returns_none_for_revoked_session(db_session):
    school = create_school(db_session, "SCH-SS0006")
    user = create_user(db_session, school.id, "revokedlookup@example.com")
    session, _ = create_session(db_session, user)

    revoke_session(db_session, session)

    assert get_active_session_by_id(db_session, session.id) is None


def test_get_active_session_by_id_returns_none_for_expired_session(db_session):
    """
    Constructs the UserSession directly (bypassing create_session) since
    create_session has no expires_at override - this test verifies
    get_active_session_by_id's expiry check, not create_session's
    lifetime-calculation logic, which is already covered separately.
    """
    school = create_school(db_session, "SCH-SS0007")
    user = create_user(db_session, school.id, "expiredlookup@example.com")

    expired_session = UserSession(
        user_id=user.id,
        refresh_token_hash=_hash_refresh_token("expired-token"),
        expires_at=_utc_now() - timedelta(minutes=1),
    )
    db_session.add(expired_session)
    db_session.commit()

    assert get_active_session_by_id(db_session, expired_session.id) is None


def test_get_active_session_by_refresh_token_finds_session(db_session):
    school = create_school(db_session, "SCH-SS0008")
    user = create_user(db_session, school.id, "tokenlookup@example.com")
    session, refresh_token = create_session(db_session, user)

    found = get_active_session_by_refresh_token(db_session, refresh_token)

    assert found is not None
    assert found.id == session.id


def test_get_active_session_by_refresh_token_returns_none_for_wrong_token(db_session):
    school = create_school(db_session, "SCH-SS0009")
    user = create_user(db_session, school.id, "wrongtoken@example.com")
    create_session(db_session, user)

    assert get_active_session_by_refresh_token(db_session, "not-a-real-token") is None


def test_rotate_refresh_token_changes_hash_and_invalidates_old_token(db_session):
    school = create_school(db_session, "SCH-SS0010")
    user = create_user(db_session, school.id, "rotate@example.com")
    session, old_token = create_session(db_session, user)
    old_hash = session.refresh_token_hash

    new_token = rotate_refresh_token(db_session, session)

    assert new_token != old_token
    assert session.refresh_token_hash != old_hash
    assert session.refresh_token_hash == _hash_refresh_token(new_token)
    assert get_active_session_by_refresh_token(db_session, old_token) is None
    found = get_active_session_by_refresh_token(db_session, new_token)
    assert found is not None
    assert found.id == session.id


def test_revoke_session_sets_revoked_at(db_session):
    school = create_school(db_session, "SCH-SS0011")
    user = create_user(db_session, school.id, "revoke@example.com")
    session, _ = create_session(db_session, user)

    assert session.revoked_at is None

    revoke_session(db_session, session)

    assert session.revoked_at is not None


def test_revoke_session_is_idempotent(db_session):
    school = create_school(db_session, "SCH-SS0012")
    user = create_user(db_session, school.id, "idempotent@example.com")
    session, _ = create_session(db_session, user)

    revoke_session(db_session, session)
    first_revoked_at = session.revoked_at

    revoke_session(db_session, session)

    assert session.revoked_at == first_revoked_at


def test_revoke_all_sessions_revokes_only_that_users_sessions(db_session):
    school = create_school(db_session, "SCH-SS0013")
    user_a = create_user(db_session, school.id, "usera@example.com")
    user_b = create_user(db_session, school.id, "userb@example.com")

    session_a1, _ = create_session(db_session, user_a)
    session_a2, _ = create_session(db_session, user_a)
    session_b1, _ = create_session(db_session, user_b)

    revoke_all_sessions(db_session, user_a)

    db_session.refresh(session_a1)
    db_session.refresh(session_a2)
    db_session.refresh(session_b1)

    assert session_a1.revoked_at is not None
    assert session_a2.revoked_at is not None
    assert session_b1.revoked_at is None
    assert session_a1.revoked_at == session_a2.revoked_at