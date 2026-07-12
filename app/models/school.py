# app/models/school.py
"""
School ORM model.

The tenant aggregate root: every other domain table (users, students,
teachers, attendance, etc.) will eventually carry a school_id foreign key
pointing back to this table.
"""

import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, SmallInteger, String, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from app.db.base import Base


class School(Base):
    """
    A tenant school.

    total_students and total_teachers are self-reported onboarding metadata
    collected at registration time — NOT a live/derived count. Once the
    students and teachers tables exist, those tables are the authoritative
    source for actual counts; do not treat these columns as accurate beyond
    the point of initial registration without an explicit sync mechanism.

    created_at/updated_at are stored as naive UTC datetimes by application
    convention. MySQL's DATETIME type does not persist timezone offset
    information, so timezone-correctness here depends entirely on the
    application always writing and reading these values in UTC.
    """

    __tablename__ = "schools"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Public-facing identifier, format SCH-XXXXXX. Generated in the service
    # layer at creation time, not here — the model only enforces uniqueness.
    school_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    established_year: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)

    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)

    academic_board: Mapped[str | None] = mapped_column(String(100), nullable=True)
    medium_of_instruction: Mapped[str | None] = mapped_column(String(100), nullable=True)

    total_students: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    total_teachers: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    classes_offered: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<School id={self.id} school_code={self.school_code!r} name={self.name!r}>"