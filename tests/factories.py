"""Shared test factories for creating domain records against the
db_session fixture.

Functions here create and commit real rows - they are not pytest
fixtures themselves (see conftest.py for those, e.g. db_session).
Keep this file's functions free of test-specific assertions or setup;
they should only ever construct valid domain objects.
"""

from datetime import datetime, timezone

from app.models.school import School
from app.models.user import User, UserRole
from app.models.user_password import UserPassword
from app.services import password_service


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


def create_user(db_session, school_id, email: str, *, deleted: bool = False) -> User:
    """Creates and commits a User."""
    user = User(school_id=school_id, email=email, name="Test User", role=UserRole.ADMIN)
    if deleted:
        user.deleted_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db_session.add(user)
    db_session.commit()
    return user


def create_user_password(
    db_session, user_id, *, password: str = "correct-horse-battery-staple"
) -> UserPassword:
    """Creates and commits a UserPassword row with a real Argon2id hash."""
    user_password = UserPassword(
        user_id=user_id,
        password_hash=password_service.hash_password(password),
    )
    db_session.add(user_password)
    db_session.commit()
    return user_password
