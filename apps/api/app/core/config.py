from functools import lru_cache
from typing import List, Union

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PROJECT_NAME: str = "AI Commerce Platform"
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    @field_validator("DEBUG", mode="before")
    @classmethod
    def assemble_debug(cls, v: Union[str, bool, int]) -> bool:
        if isinstance(v, str):
            v_lower = v.strip().lower()
            if v_lower in ("release", "prod", "production", "false", "0", "no", "off"):
                return False
            if v_lower in ("debug", "dev", "development", "true", "1", "yes", "on"):
                return True
        return bool(v)

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:4200", "http://127.0.0.1:4200"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Databases
    # Used for migrations and DDL (superuser/migration owner)
    MIGRATION_DATABASE_URL: str = Field(
        default="postgresql+asyncpg://commerce_admin:commerce_admin_secret@localhost:5433/commerce_db"
    )
    # Used at runtime (non-superuser with RLS enforcement)
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://commerce_app:commerce_app_secret@localhost:5433/commerce_db"
    )
    TEST_DATABASE_URL: str = Field(
        default="postgresql+asyncpg://commerce_app:commerce_app_secret@localhost:5433/commerce_test_db"
    )

    @field_validator("DATABASE_URL", "MIGRATION_DATABASE_URL", "TEST_DATABASE_URL", mode="before")
    @classmethod
    def normalize_async_db_url(cls, v: str) -> str:
        """Ensure PostgreSQL URLs use the asyncpg driver (e.g. Render/Neon inject postgres://)."""
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            if v.startswith("postgresql://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # JWT & Auth
    JWT_SECRET_KEY: str = "development-secret-key-must-be-changed-in-production-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Cookie Settings for Refresh Token
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_DOMAIN: Union[str, None] = None

    # Storage
    STORAGE_BACKEND: str = "local"
    LOCAL_STORAGE_PATH: str = "./uploads"
    AZURE_STORAGE_CONNECTION_STRING: Union[str, None] = None
    AZURE_STORAGE_CONTAINER: str = "media"

    # Observability
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
