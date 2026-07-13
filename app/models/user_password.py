
"""
UserPassword ORM model.

A strict 1:1 extension of User, holding only the password hash and
related timestamps. Deliberately excludes plaintext password handling,
strength validation, and password history - hashing/verification belong
to the authentication service layer, and history (if ever required) is
a separate future table, not scope creep on this one.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from app.db.base import Base


class UserPassword(Base):
    """
    Password credential record, 1:1 with User via a shared primary key
    (user_id is both PK and FK - the database enforces exactly one
    password row per user, no surrogate id needed).

    password_hash stores only the output of the service layer's Argon2id
    hashing (via pwdlib) - this model never receives, stores, or reasons
    about plaintext passwords.

    password_changed_at and created_at both default to server_default=
    func.now(). MySQL's NOW() returns the same value for every reference
    within a single statement, so on initial INSERT both columns receive
    an identical timestamp - password_changed_at is never NULL and starts
    equal to created_at, exactly as it should on account creation. Later
    password changes update password_changed_at explicitly via the
    service layer; created_at never changes.

    ondelete="CASCADE": if a User row is ever hard-deleted, its password
    row is deleted with it, preventing orphaned credential records for a
    user that no longer exists. (User itself currently uses soft delete
    via deleted_at, so in practice this cascade is a safety net for any
    future hard-delete path, not the primary deletion mechanism.)
    """

    __tablename__ = "user_passwords"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    password_changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<UserPassword user_id={self.user_id}>"