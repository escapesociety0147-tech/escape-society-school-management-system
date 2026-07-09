"""
Database engine and session management.

No other module should call create_engine() or sessionmaker() directly —
import `engine` or the `get_db` dependency from here.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.sqlalchemy_database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session scoped to a single
    request, and guarantees it's closed afterward regardless of whether
    the request succeeded or raised.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
