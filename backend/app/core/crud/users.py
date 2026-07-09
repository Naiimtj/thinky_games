"""User registration and authentication use-cases."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import hash_password, verify_password
from app.core.database.models import User
from app.core.schemas.user import UserCreate


def register_user(db: Session, payload: UserCreate) -> User:
    """Persist a new user, rejecting duplicated usernames or emails."""
    if _is_username_or_email_taken(db, payload.username, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already registered",
        )

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> User:
    """Return the user when credentials are valid, otherwise raise 401."""
    user = db.query(User).filter(User.username == username).first()
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    return user


def _is_username_or_email_taken(db: Session, username: str, email: str) -> bool:
    """Return True when either the username or the email is already in use."""
    existing = (
        db.query(User)
        .filter((User.username == username) | (User.email == email))
        .first()
    )
    return existing is not None
