"""
UserSession ORM model.

Persists session state only - this model has no knowledge of JWTs,
cookies, signing, verification, or refresh rotation policy. That logic
belongs entirely to the future authentication service layer. This
table's id also serves as the JWT's "sid" claim, so the service layer
can look up a session directly from a decoded token without a separate
lookup column.

One user may have many concurrent sessions (no uniqueness on user_id) -
supports multi-device login and "remember me" (a longer expires_at set
at session-creation time, not a separate field).
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.db.base import Base


class UserSession(Base):
    """
    A single authenticated session, one row per active or historical
    login.

    refresh_token_hash stores a cryptographic hash (currently SHA-256 in
    the service layer) of the refresh token - never the raw token
    itself. Unlike password hashing, this deliberately does NOT use
    Argon2id: the refresh token is server-generated with high entropy
    already, so a slow, memory-hard hash buys no additional security
    here and would only add unnecessary CPU cost on every session
    lookup. The specific algorithm is a service-layer implementation
    detail this model's contract does not depend on.

    revoked_at follows the same nullable-timestamp pattern as
    User.deleted_at: NULL means the session is active, any timestamp
    means it was revoked (logout, forced revocation, rotation, etc.) and
    records exactly when.

    expires_at is an absolute timestamp decided at session-creation time,
    not a duration - this is what "remember me" naturally means (a
    longer expires_at chosen at login), and it's what every downstream
    validity check queries against directly.

    ip_address and user_agent are captured once at login and never
    updated afterward. They exist for operational/security purposes
    (device-list display, suspicious-login investigation, per-device
    revocation) - not for parsing or fraud scoring, which would be
    separate future functionality.

    There is deliberately no last_used_at column: nothing in the current
    PRD requires idle-timeout behavior, and maintaining it would mean a
    database write on every authenticated request to support a feature
    that doesn't exist yet. Add it when idle timeout becomes a real
    requirement, not before.
    """

    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    refresh_token_hash: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )

    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="sessions")

    def __repr__(self) -> str:
        status = "active" if self.revoked_at is None else "revoked"
        return (
            f"<UserSession id={self.id} "
            f"user_id={self.user_id} "
            f"status={status}>"
        )