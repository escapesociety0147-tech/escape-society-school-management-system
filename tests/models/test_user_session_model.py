"""
Persistence tests for the UserSession model.

Covers happy-path round trip, the multi-session-per-user invariant (the
direct counterpart to UserPassword's one-row-per-user invariant), FK
enforcement, required-field enforcement, the database-level
ON DELETE CASCADE constraint, revocation behavior, and the bidirectional
User <-> UserSession relationship. Deliberately excludes anything related
to JWT signing/verification, refresh-token rotation policy, or login
flow - those belong to authentication service-layer tests, not ORM
persistence tests.
"""

from datetime import datetime, timedelta, timezone
import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models.school import School
from app.models.user import User, UserRole
from app.models.user_session import UserSession


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


def create_user(db_session, school_id: uuid.UUID, email: str) -> User:
    """Creates and commits a User for session tests to attach to."""
    user = User(school_id=school_id, email=email, name="Test User", role=UserRole.ADMIN)
    db_session.add(user)
    db_session.commit()
    return user


def create_user_session(
    db_session,
    user: User,
    *,
    refresh_token_hash: str | None = None,
    expires_at: datetime | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> UserSession:
    """
    Creates and commits a UserSession. refresh_token_hash defaults to a
    unique value derived from a fresh UUID; expires_at defaults to one
    hour from now. Both are overridable for tests that care about
    specific values.
    """
    session = UserSession(
        user_id=user.id,
        refresh_token_hash=refresh_token_hash or f"hash-{uuid.uuid4()}",
        expires_at=expires_at or (datetime.now(timezone.utc) + timedelta(hours=1)),
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db_session.add(session)
    db_session.commit()
    return session


def test_create_user_session_round_trip(db_session):
    """A fully-populated UserSession persists and reloads with identical values."""
    school = create_school(db_session, "SCH-US0001")
    user = create_user(db_session, school.id, "roundtrip@example.com")

    session = create_user_session(
        db_session,
        user,
        refresh_token_hash="hash-roundtrip",
        ip_address="203.0.113.42",
        user_agent="Mozilla/5.0 (test agent)",
    )
    db_session.refresh(session)

    fetched = db_session.get(UserSession, session.id)

    assert fetched is not None
    assert fetched.user_id == user.id
    assert fetched.refresh_token_hash == "hash-roundtrip"
    assert fetched.ip_address == "203.0.113.42"
    assert fetched.user_agent == "Mozilla/5.0 (test agent)"
    assert fetched.expires_at is not None
    assert fetched.revoked_at is None
    assert fetched.created_at is not None
    assert fetched.updated_at is not None


def test_multiple_sessions_per_user_allowed(db_session):
    """
    Two UserSession rows for the same user both persist successfully at
    the database level, proving the opposite invariant from
    UserPassword's shared primary key: a user may have many concurrent
    sessions (multi-device login, "remember me" alongside a short-lived
    session, etc.).

    This test verifies the database constraint only, via a direct query
    - not the ORM relationship. That's covered separately by
    test_user_sessions_relationship_reflects_database, so a failure here
    points specifically at the schema/constraint layer, not the
    relationship() configuration.
    """
    school = create_school(db_session, "SCH-US0002")
    user = create_user(db_session, school.id, "multisession@example.com")

    create_user_session(db_session, user)
    create_user_session(db_session, user)

    rows = db_session.scalars(
        select(UserSession).where(UserSession.user_id == user.id)
    ).all()
    assert len(rows) == 2


def test_session_requires_existing_user(db_session):
    """
    A user_id that does not correspond to any real User row raises
    IntegrityError, proving the FK constraint is enforced by MySQL/InnoDB.
    """
    nonexistent_user_id = uuid.uuid4()

    session = UserSession(
        user_id=nonexistent_user_id,
        refresh_token_hash="hash-orphan",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db_session.add(session)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()


def test_refresh_token_hash_must_be_unique(db_session):
    """A duplicate refresh_token_hash raises IntegrityError."""
    school = create_school(db_session, "SCH-US0004")
    user = create_user(db_session, school.id, "duphash@example.com")

    create_user_session(db_session, user, refresh_token_hash="duplicate-hash")

    second = UserSession(
        user_id=user.id,
        refresh_token_hash="duplicate-hash",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db_session.add(second)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()


def test_refresh_token_hash_is_required(db_session):
    """Omitting refresh_token_hash raises IntegrityError at commit."""
    school = create_school(db_session, "SCH-US0005")
    user = create_user(db_session, school.id, "nohash@example.com")

    session = UserSession(user_id=user.id, expires_at=datetime.now(timezone.utc) + timedelta(hours=1))
    db_session.add(session)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()


def test_expires_at_is_required(db_session):
    """Omitting expires_at raises IntegrityError at commit."""
    school = create_school(db_session, "SCH-US0006")
    user = create_user(db_session, school.id, "noexpiry@example.com")

    session = UserSession(user_id=user.id, refresh_token_hash="hash-no-expiry")
    db_session.add(session)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()


def test_session_deleted_when_user_deleted(db_session):
    """
    This test intentionally performs a physical delete to verify the
    database-level ON DELETE CASCADE constraint. The application's normal
    deletion workflow uses deleted_at (soft delete) on User - this test
    exists only to confirm the schema behaves correctly if a physical
    delete ever occurs, not to endorse hard deletes as a normal
    application code path.
    """
    school = create_school(db_session, "SCH-US0007")
    user = create_user(db_session, school.id, "cascade@example.com")

    session = create_user_session(db_session, user)

    db_session.delete(user)
    db_session.commit()

    assert db_session.get(User, user.id) is None
    assert db_session.get(UserSession, session.id) is None


def test_revoking_a_session_sets_revoked_at(db_session):
    """
    Setting revoked_at excludes the session from an active-only query
    while the row remains physically present, mirroring User's soft-
    delete lifecycle pattern.
    """
    school = create_school(db_session, "SCH-US0008")
    user = create_user(db_session, school.id, "revoke@example.com")

    session = create_user_session(db_session, user)

    active_sessions = db_session.scalars(
        select(UserSession).where(
            UserSession.id == session.id,
            UserSession.revoked_at.is_(None),
        )
    ).all()
    assert len(active_sessions) == 1

    session.revoked_at = datetime.now(timezone.utc).replace(microsecond=0)
    db_session.commit()
    db_session.refresh(session)

    active_sessions_after = db_session.scalars(
        select(UserSession).where(
            UserSession.id == session.id,
            UserSession.revoked_at.is_(None),
        )
    ).all()
    assert active_sessions_after == []

    all_sessions = db_session.scalars(select(UserSession).where(UserSession.id == session.id)).all()
    assert len(all_sessions) == 1
    assert all_sessions[0].revoked_at is not None


def test_user_sessions_relationship_reflects_database(db_session):
    """
    User.sessions (the bidirectional ORM relationship) returns exactly
    the sessions that exist in the database for that user - verifying
    the relationship()/back_populates configuration itself, distinct
    from test_multiple_sessions_per_user_allowed, which verifies only
    the raw database constraint via a direct query.
    """
    school = create_school(db_session, "SCH-US0009")
    user = create_user(db_session, school.id, "relationship@example.com")

    session_a = create_user_session(db_session, user)
    session_b = create_user_session(db_session, user)

    db_session.refresh(user)

    assert len(user.sessions) == 2
    assert {s.id for s in user.sessions} == {session_a.id, session_b.id}

    for session in user.sessions:
        assert session.user.id == user.id


def test_ip_address_and_user_agent_are_optional(db_session):
    """
    ip_address and user_agent are nullable by design - this documents
    that contract explicitly and guards against either column
    accidentally becoming NOT NULL in a future migration.
    """
    school = create_school(db_session, "SCH-US0010")
    user = create_user(db_session, school.id, "nodevice@example.com")

    session = create_user_session(db_session, user)
    db_session.refresh(session)

    assert session.ip_address is None
    assert session.user_agent is None