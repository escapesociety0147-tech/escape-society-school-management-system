"""
User ORM model.

Every human actor in the system (admin, teacher, parent, student) has
exactly one row here, scoped to a school. Authentication credentials,
profile details, and preferences live in separate tables
(user_passwords, user_profiles, user_preferences, etc.) per the PRD's
canonical data model - this table is identity only.
"""

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from app.db.base import Base


class UserRole(StrEnum):
    ADMIN = "admin"
    TEACHER = "teacher"
    PARENT = "parent"
    STUDENT = "student"


class User(Base):
    """
    Core identity record.

    Email uniqueness is enforced case-insensitively at the database level
    via a UNIQUE index. Normalizing email casing (lowercasing) BEFORE
    insert/update is the responsibility of the service layer - this model
    intentionally does not transform input itself, to keep persistence and
    business logic separated. Any code path that writes User.email must
    normalize first.

    deleted_at is the sole soft-delete/account-state signal for now:
    NULL means active, any timestamp means removed. There is currently no
    separate "disabled" or "suspended" state - the PRD does not define one,
    and login rate-limiting/lockout (a distinct, session-level concern) is
    handled elsewhere, not via this column.
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    school_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("schools.id"), nullable=False, index=True
    )

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=True, length=20), nullable=False, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role.value}>"