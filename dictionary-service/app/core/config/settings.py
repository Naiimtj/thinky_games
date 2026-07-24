"""Application settings loaded from environment variables."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings for the dictionary service."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg2://dict:dict@localhost:5432/dictionary"
    admin_password: str = ""
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:8080"]
    app_name: str = "Dictionary Service"
    debug: bool = False


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""
    return Settings()
