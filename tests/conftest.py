"""
Shared pytest fixtures for database-backed tests.

Tests run against a dedicated MySQL database (school_management_test_db),
never the development database. Each test runs inside an outer transaction
that is rolled back afterward, so tests never leave data behind and never
interfere with each other.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import get_settings
from app.db.base import Base
import app.models  # noqa: F401 - ensures all models are registered on Base.metadata


def _build_test_database_url():
    settings = get_settings()
    base_url = settings.sqlalchemy_database_url
    return base_url.set(database="school_management_test_db")


@pytest.fixture(scope="session")
def test_engine():
    """
    Session-scoped engine pointed at the dedicated test database.
    Creates the database and all tables once per test run.
    """
    settings = get_settings()
    admin_url = settings.sqlalchemy_database_url.set(database="")
    admin_engine = create_engine(admin_url)
    with admin_engine.connect() as conn:
        conn.execute(text("CREATE DATABASE IF NOT EXISTS school_management_test_db"))
        conn.commit()
    admin_engine.dispose()

    engine = create_engine(_build_test_database_url())
    Base.metadata.create_all(engine)

    yield engine

    engine.dispose()


@pytest.fixture
def db_session(test_engine):
    """
    Function-scoped session wrapped in an outer transaction that is always
    rolled back, regardless of whether the test itself calls commit().
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()