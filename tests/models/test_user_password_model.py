"""
Persistence tests for the UserPassword model.

Covers happy-path round trip, the shared-primary-key one-row-per-user
invariant, FK enforcement, required-field enforcement, the database-level
ON DELETE CASCADE constraint, and the password_changed_at initialization
invariant. Deliberately excludes anything related to Argon2 hashing,
verification, or password strength - those belong to authentication
service-layer tests, not ORM persistence tests.
"""

import uuid

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.school import School
from app.models.user import User, UserRole
from app.models.user_password import UserPassword


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
    """Creates and commits a User for password tests to attach to."""
    user = User(school_id=school_id, email=email, name="Test User", role=UserRole.ADMIN)
    db_session.add(user)
    db_session.commit()
    return user


def test_create_user_password_round_trip(db_session):
    """A UserPassword persists and reloads with identical values."""
    school = create_school(db_session, "SCH-UP0001")
    user = create_user(db_session, school.id, "roundtrip@example.com")

    user_password = UserPassword(user_id=user.id, password_hash="argon2id$fake-hash-for-testing")
    db_session.add(user_password)
    db_session.commit()
    db_session.refresh(user_password)

    fetched = db_session.get(UserPassword, user.id)

    assert fetched is not None
    assert fetched.user_id == user.id
    assert fetched.password_hash == "argon2id$fake-hash-for-testing"
    assert fetched.password_changed_at is not None
    assert fetched.created_at is not None
    assert fetched.updated_at is not None


def test_user_can_have_only_one_password_row(db_session):
    """
    A second UserPassword row for the same user_id violates the shared
    primary key, proving the database enforces the one-to-one invariant.

    first is expunged from the session after commit so that the second
    insert's primary-key conflict is detected solely by the database
    (what this test actually verifies), not by SQLAlchemy's identity map
    noticing two in-memory objects with the same identity - which would
    raise a benign but noisy SAWarning unrelated to the invariant being
    tested.
    """
    school = create_school(db_session, "SCH-UP0002")
    user = create_user(db_session, school.id, "onlyone@example.com")

    first = UserPassword(user_id=user.id, password_hash="first-hash")
    db_session.add(first)
    db_session.commit()
    db_session.expunge(first)

    second = UserPassword(user_id=user.id, password_hash="second-hash")
    db_session.add(second)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()


def test_password_requires_existing_user(db_session):
    """
    A user_id that does not correspond to any real User row raises
    IntegrityError, proving the FK constraint is enforced by MySQL/InnoDB.
    """
    nonexistent_user_id = uuid.uuid4()

    user_password = UserPassword(user_id=nonexistent_user_id, password_hash="orphan-hash")
    db_session.add(user_password)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()


def test_password_hash_is_required(db_session):
    """Omitting password_hash raises IntegrityError at commit."""
    school = create_school(db_session, "SCH-UP0004")
    user = create_user(db_session, school.id, "nohash@example.com")

    user_password = UserPassword(user_id=user.id)
    db_session.add(user_password)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()


def test_password_row_deleted_when_user_deleted(db_session):
    """
    This test intentionally performs a physical delete to verify the
    database-level ON DELETE CASCADE constraint. The application's normal
    deletion workflow uses deleted_at (soft delete) and is tested
    separately on the User model - this test exists only to confirm the
    schema behaves correctly if a physical delete ever occurs (e.g. data
    repair, GDPR erasure, administrative purge tooling), not to endorse
    hard deletes as a normal application code path.
    """
    school = create_school(db_session, "SCH-UP0005")
    user = create_user(db_session, school.id, "cascade@example.com")

    user_password = UserPassword(user_id=user.id, password_hash="cascade-hash")
    db_session.add(user_password)
    db_session.commit()

    db_session.delete(user)
    db_session.commit()

    assert db_session.get(User, user.id) is None
    assert db_session.get(UserPassword, user.id) is None


def test_password_hash_round_trips_without_modification(db_session):
    """
    The stored hash string is persisted byte-for-byte, with no truncation,
    trimming, or case transformation applied anywhere in the persistence
    path. This model must never mutate a hash it's given.
    """
    school = create_school(db_session, "SCH-UP0006")
    user = create_user(db_session, school.id, "exacthash@example.com")

    exact_hash = "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$SomeBase64HashValueHere=="

    user_password = UserPassword(user_id=user.id, password_hash=exact_hash)
    db_session.add(user_password)
    db_session.commit()
    db_session.refresh(user_password)

    fetched = db_session.get(UserPassword, user.id)
    assert fetched.password_hash == exact_hash


def test_password_changed_at_defaults_to_created_at(db_session):
    """
    Regression test for the NOW()-single-evaluation initialization
    invariant: on creation, password_changed_at must equal created_at
    exactly, never NULL, never a separately-evaluated timestamp.
    """
    school = create_school(db_session, "SCH-UP0007")
    user = create_user(db_session, school.id, "initinvariant@example.com")

    user_password = UserPassword(user_id=user.id, password_hash="init-hash")
    db_session.add(user_password)
    db_session.commit()
    db_session.refresh(user_password)

    assert user_password.password_changed_at == user_password.created_at