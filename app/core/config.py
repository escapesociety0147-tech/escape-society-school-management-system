"""
Centralized application configuration.

All environment-dependent values are defined here as a single source of
truth. No other module should read from `os.environ` directly — import
`get_settings()` instead.
"""

from datetime import timedelta
from enum import StrEnum
from functools import lru_cache
from typing import Literal

from typing import Annotated
from pydantic import SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from sqlalchemy import URL

INSECURE_SECRET_VALUES = {
    "",
    "change_me",
    "replace_with_a_long_random_secret",
    "secret",
    "password",
}


class AppEnvironment(StrEnum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class SameSite(StrEnum):
    LAX = "lax"
    STRICT = "strict"
    NONE = "none"


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Application ---
    APP_NAME: str
    APP_VERSION: str
    APP_ENV: AppEnvironment = AppEnvironment.DEVELOPMENT
    DEBUG: bool = False

    # --- API ---
    API_V1_PREFIX: str = "/api/v1"

    # --- Security / JWT ---
    SECRET_KEY: SecretStr
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- Session & Cookie ---
    SESSION_COOKIE_NAME: str = "esm_session"
    SESSION_COOKIE_HTTPONLY: bool = True
    SESSION_COOKIE_SAMESITE: SameSite = SameSite.LAX
    SESSION_COOKIE_PATH: str = "/"
    SESSION_COOKIE_DOMAIN: str | None = None
    SESSION_LIFETIME_MINUTES: int = 10080  # 7 days

    # --- Database ---
    DB_HOST: str
    DB_PORT: int = 3306
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: SecretStr

    # --- CORS ---
    BACKEND_CORS_ORIGINS: Annotated[list[str], NoDecode] = []

    # --- Logging ---
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: object) -> object:
        """Allow BACKEND_CORS_ORIGINS to be a comma-separated string in .env."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("LOG_LEVEL", mode="before")
    @classmethod
    def _normalize_log_level(cls, value: object) -> object:
        """Allow lowercase log levels in .env (e.g. 'info') by normalizing case."""
        if isinstance(value, str):
            return value.upper()
        return value

    @model_validator(mode="after")
    def _validate_production_readiness(self) -> "Settings":
        if self.APP_ENV is not AppEnvironment.PRODUCTION:
            return self

        if self.DEBUG:
            raise ValueError("DEBUG must be False when APP_ENV=production.")

        if self.SECRET_KEY.get_secret_value().strip().lower() in INSECURE_SECRET_VALUES:
            raise ValueError(
                "SECRET_KEY is empty or a known placeholder value. "
                "Set a strong, unique secret before running in production."
            )

        if self.DB_PASSWORD.get_secret_value().strip().lower() in INSECURE_SECRET_VALUES:
            raise ValueError(
                "DB_PASSWORD is empty or a known placeholder value. "
                "Set a real database password before running in production."
            )

        return self

    @property
    def cookie_secure(self) -> bool:
        """
        Derived, not configurable directly: forgetting to flip a raw
        COOKIE_SECURE flag in production is a real, recurring class of bug.
        Deriving it from APP_ENV removes that failure mode entirely.
        """
        return self.APP_ENV in {AppEnvironment.PRODUCTION, AppEnvironment.STAGING}

    @property
    def session_lifetime(self) -> timedelta:
        """Session lifetime as a timedelta for direct use in expiry math."""
        return timedelta(minutes=self.SESSION_LIFETIME_MINUTES)

    @property
    def access_token_expires_delta(self) -> timedelta:
        """JWT lifetime as a timedelta, mirroring session_lifetime's ergonomics."""
        return timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)

    @property
    def sqlalchemy_database_url(self) -> URL:
        """
        SQLAlchemy connection URL, built via URL.create() rather than string
        concatenation so special characters in credentials (e.g. '@', '%')
        are escaped correctly. No other module should assemble this itself.
        """
        return URL.create(
            drivername="mysql+pymysql",
            username=self.DB_USER,
            password=self.DB_PASSWORD.get_secret_value(),
            host=self.DB_HOST,
            port=self.DB_PORT,
            database=self.DB_NAME,
        )


@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.

    Cached so `Settings()` — and its env/file I/O — only runs once per
    process. Use dependency-injection overrides in tests rather than
    bypassing this cache.
    """
    return Settings()
