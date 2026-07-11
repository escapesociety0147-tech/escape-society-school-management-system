"""
Persistence tests for the School model.

Establishes the canonical testing pattern every future model's test
suite should follow: happy-path round trip, default values, required
field enforcement, and uniqueness constraint enforcement.
"""

import uuid

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.school import School


def test_create_school_round_trip(db_session):
    """A fully-populated School persists and reloads with identical values."""
    classes = ["Grade 1", "Grade 2", "Science Stream"]

    school = School(
        school_code="SCH-000001",
        name="Greenwood High",
        type="Secondary",
        established_year=1998,
        address="123 Example Street",
        city="Lagos",
        state="Lagos",
        country="Nigeria",
        postal_code="100001",
        email="info@greenwood.example",
        phone="+2348000000000",
        website="https://greenwood.example",
        academic_board="WAEC",
        medium_of_instruction="English",
        classes_offered=classes,
    )

    db_session.add(school)
    db_session.commit()

    assert school.id is not None
    assert isinstance(school.id, uuid.UUID)

    fetched = db_session.get(School, school.id)

    assert fetched is not None
    assert fetched.school_code == "SCH-000001"
    assert fetched.name == "Greenwood High"
    assert fetched.type == "Secondary"
    assert fetched.established_year == 1998
    assert fetched.address == "123 Example Street"
    assert fetched.city == "Lagos"
    assert fetched.state == "Lagos"
    assert fetched.country == "Nigeria"
    assert fetched.postal_code == "100001"
    assert fetched.email == "info@greenwood.example"
    assert fetched.phone == "+2348000000000"
    assert fetched.website == "https://greenwood.example"
    assert fetched.academic_board == "WAEC"
    assert fetched.medium_of_instruction == "English"
    assert fetched.classes_offered == classes
    assert fetched.created_at is not None
    assert fetched.updated_at is not None


def test_school_defaults_applied(db_session):
    """Omitted total_students/total_teachers/classes_offered fall back correctly."""
    school = School(school_code="SCH-000002", name="Minimal School")
    db_session.add(school)
    db_session.commit()

    fetched = db_session.get(School, school.id)
    assert fetched.total_students == 0
    assert fetched.total_teachers == 0
    assert fetched.classes_offered is None


def test_school_requires_name(db_session):
    """Omitting the required `name` field raises IntegrityError at commit."""
    school = School(school_code="SCH-000003")
    db_session.add(school)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()


def test_school_code_must_be_unique(db_session):
    """A duplicate school_code raises IntegrityError, proving the index is enforced."""
    school_a = School(school_code="SCH-000004", name="School A")
    db_session.add(school_a)
    db_session.commit()

    school_b = School(school_code="SCH-000004", name="School B")
    db_session.add(school_b)

    with pytest.raises(IntegrityError):
        db_session.commit()

    db_session.rollback()