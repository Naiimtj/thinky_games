"""User registration and authentication use-cases."""

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.auth import hash_password, verify_password
from app.core.database.models import FriendPreference, User
from app.core.schemas.user import (
    FriendPreferencePublic,
    UserCreate,
    UserLookup,
    UserProfile,
    UserUpdate,
)


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


def update_user(db: Session, user: User, payload: UserUpdate) -> User:
    """Update username/email/password for an existing user."""
    if payload.username is not None and payload.username != user.username:
        _ensure_username_available(db, payload.username, excluded_user_id=user.id)
        user.username = payload.username

    if payload.email is not None and payload.email != user.email:
        _ensure_email_available(db, payload.email, excluded_user_id=user.id)
        user.email = payload.email

    if payload.password is not None:
        user.password_hash = hash_password(payload.password)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    """Delete the account and all associated rows via cascades."""
    db.delete(user)
    db.commit()


def set_global_share(db: Session, user: User, enabled: bool) -> User:
    """Toggle whether scores are visible to all authenticated users."""
    user.share_results_globally = enabled
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def set_avatar_url(db: Session, user: User, avatar_url: str | None) -> User:
    """Set or clear the user's avatar URL/data URI."""
    user.avatar_url = avatar_url
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def search_users(
    db: Session, *, query: str, excluded_user_id: int, limit: int = 20
) -> list[UserLookup]:
    """Search users by username or email, excluding the current user."""
    normalized = query.strip()
    if not normalized:
        return []
    rows = (
        db.query(User)
        .filter(
            User.id != excluded_user_id,
            or_(
                User.username.ilike(f"%{normalized}%"),
                User.email.ilike(f"%{normalized}%"),
            ),
        )
        .order_by(User.username.asc())
        .limit(limit)
        .all()
    )
    return [UserLookup.model_validate(row) for row in rows]


def upsert_friend_preference(
    db: Session, *, user_id: int, friend_id: int, share_times: bool
) -> FriendPreferencePublic:
    """Create or update the preference for sharing times with one friend."""
    if user_id == friend_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot add yourself as a friend.",
        )

    friend = db.query(User).filter(User.id == friend_id).first()
    if friend is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend user not found.",
        )

    relation = (
        db.query(FriendPreference)
        .filter(
            FriendPreference.user_id == user_id,
            FriendPreference.friend_id == friend_id,
        )
        .first()
    )
    if relation is None:
        relation = FriendPreference(
            user_id=user_id,
            friend_id=friend_id,
            share_times=share_times,
        )
    else:
        relation.share_times = share_times

    db.add(relation)
    db.commit()
    db.refresh(relation)

    return FriendPreferencePublic(
        friend_id=friend.id,
        friend_username=friend.username,
        share_times=relation.share_times,
    )


def remove_friend_preference(db: Session, *, user_id: int, friend_id: int) -> None:
    """Delete a per-friend sharing preference."""
    relation = (
        db.query(FriendPreference)
        .filter(
            FriendPreference.user_id == user_id,
            FriendPreference.friend_id == friend_id,
        )
        .first()
    )
    if relation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Friend preference not found.",
        )
    db.delete(relation)
    db.commit()


def get_user_profile(db: Session, user: User) -> UserProfile:
    """Return full profile data including per-friend sharing rules."""
    relations = (
        db.query(FriendPreference, User.username)
        .join(User, User.id == FriendPreference.friend_id)
        .filter(FriendPreference.user_id == user.id)
        .order_by(User.username.asc())
        .all()
    )

    friends = [
        FriendPreferencePublic(
            friend_id=relation.friend_id,
            friend_username=friend_username,
            share_times=relation.share_times,
        )
        for relation, friend_username in relations
    ]

    return UserProfile(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        share_results_globally=user.share_results_globally,
        created_at=user.created_at,
        friends=friends,
    )


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
        .filter(or_(User.username == username, User.email == email))
        .first()
    )
    return existing is not None


def _ensure_username_available(
    db: Session, username: str, *, excluded_user_id: int
) -> None:
    existing = (
        db.query(User)
        .filter(User.username == username, User.id != excluded_user_id)
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already registered",
        )


def _ensure_email_available(db: Session, email: str, *, excluded_user_id: int) -> None:
    existing = (
        db.query(User)
        .filter(User.email == email, User.id != excluded_user_id)
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
