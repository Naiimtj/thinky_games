"""Password hashing, JWT helpers and authentication/authorization dependencies.

Every function here stays free of business logic so it can be unit tested
and reused across routers.
"""

import hmac
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config.env import get_settings
from app.core.database.models import User
from app.dependencies import get_db

settings = get_settings()
_password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)
_admin_password_header = APIKeyHeader(name="X-Admin-Password", auto_error=False)


def hash_password(plain_password: str) -> str:
    """Return a salted bcrypt hash for the given plain-text password."""
    return _password_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Return True when the plain-text password matches the stored hash."""
    return _password_context.verify(plain_password, password_hash)


def create_access_token(subject: str) -> str:
    """Create a signed JWT whose subject is the authenticated username."""
    expires_at = datetime.utcnow() + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": subject, "exp": expires_at}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str | None:
    """Return the token subject, or None when the token is invalid/expired."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError:
        return None
    return payload.get("sub")


def get_current_user(
    request: Request,
    bearer_token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from the HttpOnly cookie or bearer token."""
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = request.cookies.get(settings.auth_cookie_name) or bearer_token
    username = decode_access_token(token) if token else None
    if username is None:
        raise invalid_credentials

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise invalid_credentials
    return user


def require_admin_password(
    password: str | None = Depends(_admin_password_header),
) -> None:
    """Validate the ``X-Admin-Password`` header for the backup admin endpoints."""
    if not settings.admin_password:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin backup endpoints are disabled (ADMIN_PASSWORD not configured)",
        )
    if password is None or not hmac.compare_digest(password, settings.admin_password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin password",
        )
