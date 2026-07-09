"""
Declarative base for all ORM models.

Every model in app/models/ must inherit from this Base so that
Base.metadata stays complete — Alembic's autogenerate relies on it
seeing every table.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
