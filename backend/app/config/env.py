"""Application configuration loaded from environment variables."""

from functools import lru_cache
from urllib.parse import quote_plus

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly typed application settings."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    MYSQL_HOST: str = "db"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "thinky_games"
    MYSQL_USER: str
    MYSQL_PASSWORD: str

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    cors_origins: list[str] = ["http://localhost:5173"]

    # Required (non-empty) to use the /db/backup* admin endpoints.
    admin_password: str = ""
    backup_data_dir: str = "/app/backups"
    run_migrations_on_startup: bool = True

    # Optional rae-api.com key: higher daily quota for Crossclimb clues.
    # Without it, Crossclimb falls back to the curated puzzle pool.
    rae_key: str = ""

    @property
    def database_url(self) -> str:
        """Build the SQLAlchemy MySQL connection URL from discrete parts."""
        password = quote_plus(self.MYSQL_PASSWORD)
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{password}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DATABASE}"
        )


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance so the .env file is read only once."""
    return Settings()
