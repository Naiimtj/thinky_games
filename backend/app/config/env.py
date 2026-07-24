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
    # 1 year: effectively no forced re-login. JWTs still need some expiry
    # (there's no server-side revocation), but this is long enough that it
    # never happens in practice for a regular player.
    access_token_expire_minutes: int = 60 * 24 * 365
    auth_cookie_name: str = "thinky_access_token"
    auth_cookie_secure: bool = False
    cors_origins: list[str] = ["http://localhost:5173"]

    # Required (non-empty) to use the /db/backup* admin endpoints.
    admin_password: str = ""
    backup_data_dir: str = "/app/backups"
    run_migrations_on_startup: bool = True

    # Required for automatic Crossword words; also enables Wend definitions.
    rae_key: str = ""

    # Optional external dictionary service. When set, word-based games read
    # their curated pools from it instead of the local hardcoded lists.
    dictionary_service_url: str = ""
    dictionary_service_admin_password: str = ""

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
