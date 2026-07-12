"""
Persistence tests for the User model.

Covers happy-path round trip, email uniqueness, required-field
enforcement, foreign key enforcement against schools, soft-delete
lifecycle, and enum persistence across all four roles.
"""

from datetime import datetime, timezone
import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models.school import School
from app.models.user import User, UserRole


def create_school(db_session, school_code: str) -> School:
    """
    Creates and commits a fully-populated, valid School so User tests have
    a real school_id to reference. Fully populated (not just the two
    currently-required fields) so this helper stays valid even if School's
    nullable fields are tightened to NOT NULL in a future migration.
    """
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


def test_create_user_round_trip(db_session):
    """A fully-populated User persists and reloads with identical values."""
    school = create_school(db_session, "SCH-U00001")

    user = User(
        school_id=school.id,
        email="admin@greenwood.example",
        name="Ada Admin",
        role=UserRole.ADMIN,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert isinstance(user.id, uuid.UUID)

    fetched = db_session.get(User, user.id)

    assert fetched is not None
    assert fetched.school_id == school.id
    assert fetched.email == "admin@greenwood.example"
    assert fetched.name == "Ada Admin"
    assert fetched.role == UserRole.ADMIN
    assert fetched.created_at is not None
    assert fetched.updated_at is not None
    assert fetched.updated_at >= fetched.created_at
    assert fetched.deleted_at is None


def test_email_must_be_unique(db_session):
    """A duplicate email raises IntegrityError, proving the unique index is enforced."""
    school = create_school(db_session, "SCH-U00002")

    user_a = User(school_id=school.id, email="dupe@example.com", name="User A", role=UserRole.TEACHER)
    db_session.add(user_a)
    db_session.commit()

    user_b = User(school_id=school.id, email="dupe@example.com", name="User B", role=UserRole.TEACHER)
    db_session.add(user_b)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()


def test_email_is_required(db_session):
    """Omitting the required `email` field raises IntegrityError at commit."""
    school = create_school(db_session, "SCH-U00003")

    user = User(school_id=school.id, name="No Email", role=UserRole.PARENT)
    db_session.add(user)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()


def test_school_id_is_required(db_session):
    """
    Omitting school_id raises IntegrityError - this is arguably the most
    important invariant in a multi-tenant system: no user can exist
    without belonging to exactly one school.
    """
    user = User(email="no-school@example.com", name="No School", role=UserRole.STUDENT)
    db_session.add(user)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()


def test_user_requires_existing_school(db_session):
    """
    A school_id that does not correspond to any real School row raises
    IntegrityError, proving the FK constraint is actually enforced by
    MySQL/InnoDB, not just declared in the schema. If this test
    unexpectedly passes, that indicates FK enforcement is misconfigured
    (e.g. wrong storage engine, FK checks disabled) and should be
    investigated rather than the test being weakened.
    """
    nonexistent_school_id = uuid.uuid4()

    user = User(
        school_id=nonexistent_school_id,
        email="orphan@example.com",
        name="Orphan User",
        role=UserRole.STUDENT,
    )
    db_session.add(user)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()


def test_user_soft_delete_lifecycle(db_session):
    """
    Setting deleted_at excludes the user from an active-only query while
    the row remains physically present and retrievable via an unfiltered
    query, with the persisted timestamp preserved (at whole-second
    precision - MySQL's DATETIME column has no fractional-seconds
    precision and rounds sub-second values on insert, and does not
    persist timezone offset info; the application-level UTC convention
    documented on School/User's timestamp columns applies here) -
    proving soft delete behaves as intended, not as a hard delete.
    """
    school = create_school(db_session, "SCH-U00004")

    user = User(school_id=school.id, email="softdelete@example.com", name="Soft Delete", role=UserRole.TEACHER)
    db_session.add(user)
    db_session.commit()

    active_users = db_session.scalars(
        select(User).where(
            User.id == user.id,
            User.deleted_at.is_(None),
        )
    ).all()
    assert len(active_users) == 1

    deleted_time = datetime.now(timezone.utc).replace(microsecond=0)
    user.deleted_at = deleted_time
    db_session.commit()
    db_session.refresh(user)

    active_users_after = db_session.scalars(
        select(User).where(
            User.id == user.id,
            User.deleted_at.is_(None),
        )
    ).all()
    assert active_users_after == []

    all_users = db_session.scalars(select(User).where(User.id == user.id)).all()
    assert len(all_users) == 1
    assert all_users[0].deleted_at.replace(tzinfo=timezone.utc) == deleted_time


@pytest.mark.parametrize(
    "role",
    [UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT],
)
def test_user_role_persists_correctly(db_session, role):
    """
    Regression test for the values_callable enum-serialization bug: each
    role must round-trip to the exact same enum member, not just a truthy
    value.
    """
    school = create_school(db_session, f"SCH-U{role.value.upper()}")

    user = User(
        school_id=school.id,
        email=f"{role.value}@example.com",
        name=f"Test {role.value}",
        role=role,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    fetched = db_session.get(User, user.id)
    assert fetched.role == role
    assert fetched.role.value == role.value