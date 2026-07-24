"""Admin authentication dependency for dictionary-service."""

import hmac
import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

from app.core.config import get_settings

_admin_password_header = APIKeyHeader(name="X-Admin-Password", auto_error=False)


def require_admin_password(
    password: str | None = Depends(_admin_password_header),
) -> None:
    """Verify the admin password header against the configured secret."""
    settings = get_settings()
    if not settings.admin_password:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin endpoints are disabled (ADMIN_PASSWORD not configured)",
        )

    if password is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Admin-Password header",
        )

    if not secrets.compare_digest(password, settings.admin_password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin password",
        )
