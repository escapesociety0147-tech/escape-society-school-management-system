# app/models/__init__.py
"""
Import all models here so Base.metadata is complete when Alembic
autogenerates migrations. Each new model file must be imported below.
"""

from app.models.school import School

__all__ = ["School"]