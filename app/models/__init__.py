
"""
Import all models here so Base.metadata is complete when Alembic
autogenerates migrations. Each new model file must be imported below.
"""

from app.models.school import School
from app.models.user import User, UserRole

__all__ = ["School", "User", "UserRole"]