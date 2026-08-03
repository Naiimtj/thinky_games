"""User profile and privacy endpoints."""

import mimetypes

from fastapi import APIRouter, Depends, Query, Request, Response, status
from fastapi import File, HTTPException, UploadFile
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config.env import get_settings
from app.core.auth import create_access_token, get_current_user
from app.core.crud import users as user_crud
from app.core.database.models import User
from app.core import uploads as upload_service
from app.core.schemas.user import (
    FriendPreferenceCreate,
    FriendPreferencePublic,
    FriendPreferenceUpdate,
    UserLookup,
    UserPrivacyUpdate,
    UserProfile,
    UserPublic,
    UserUpdate,
)
from app.dependencies import get_db

router = APIRouter(prefix="/users", tags=["users"])
settings = get_settings()
MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
AVATAR_EXTENSIONS_BY_CONTENT_TYPE = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
}


def _get_avatar_extension(content_type: str) -> str | None:
    extension = AVATAR_EXTENSIONS_BY_CONTENT_TYPE.get(content_type.lower())
    if extension:
        return extension

    guessed = mimetypes.guess_extension(content_type)
    if guessed in {".png", ".jpg", ".jpeg", ".webp"}:
        return ".jpg" if guessed == ".jpeg" else guessed

    return None


@router.get("/me/profile", response_model=UserProfile)
def read_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserProfile:
    """Return profile data and current sharing preferences."""
    return user_crud.get_user_profile(db, current_user)


@router.patch("/me", response_model=UserPublic)
def update_me(
    payload: UserUpdate,
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserPublic:
    """Update account fields for the authenticated user."""
    previous_username = current_user.username
    updated = user_crud.update_user(db, current_user, payload)

    if updated.username != previous_username:
        access_token = create_access_token(subject=updated.username)
        response.set_cookie(
            key=settings.auth_cookie_name,
            value=access_token,
            max_age=settings.access_token_expire_minutes * 60,
            httponly=True,
            secure=settings.auth_cookie_secure or request.url.scheme == "https",
            samesite="lax",
        )
        response.set_cookie(
            key="thinky_session_hint",
            value="1",
            max_age=settings.access_token_expire_minutes * 60,
            httponly=False,
            secure=settings.auth_cookie_secure or request.url.scheme == "https",
            samesite="lax",
        )

    return updated


@router.patch("/me/privacy", response_model=UserPublic)
def update_my_privacy(
    payload: UserPrivacyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserPublic:
    """Toggle whether this user's times are public in rankings."""
    return user_crud.set_global_share(db, current_user, payload.share_results_globally)


@router.post("/me/avatar", response_model=UserPublic)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserPublic:
    """Upload avatar image to Cloudinary and store its public URL."""
    if not file.content_type:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded file must include a valid image content type.",
        )

    extension = _get_avatar_extension(file.content_type)
    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Supported avatar formats are PNG, JPG, and WEBP.",
        )

    content = await file.read()
    if len(content) > MAX_AVATAR_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Avatar file exceeds the 5MB limit.",
        )

    try:
        image_url = upload_service.upload_image(content)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Avatar upload failed while uploading to Cloudinary. "
                "Please contact the administrator."
            ),
        ) from exc
    try:
        updated_user = user_crud.set_avatar_url(db, current_user, image_url)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Avatar upload failed while storing the image in the database. "
                "Please contact the administrator."
            ),
        ) from exc
    return updated_user


@router.get("/search", response_model=list[UserLookup])
def search_users(
    q: str = Query(min_length=1, max_length=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserLookup]:
    """Find users by username or email for friend-sharing settings."""
    return user_crud.search_users(
        db,
        query=q,
        excluded_user_id=current_user.id,
    )


@router.post(
    "/me/friends",
    response_model=FriendPreferencePublic,
    status_code=status.HTTP_201_CREATED,
)
def add_or_update_friend(
    payload: FriendPreferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FriendPreferencePublic:
    """Create or update a per-friend sharing preference."""
    return user_crud.upsert_friend_preference(
        db,
        user_id=current_user.id,
        friend_id=payload.friend_id,
        share_times=payload.share_times,
    )


@router.patch("/me/friends/{friend_id}", response_model=FriendPreferencePublic)
def update_friend_share(
    friend_id: int,
    payload: FriendPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FriendPreferencePublic:
    """Update the sharing preference of an existing friend relation."""
    return user_crud.upsert_friend_preference(
        db,
        user_id=current_user.id,
        friend_id=friend_id,
        share_times=payload.share_times,
    )


@router.delete("/me/friends/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_friend(
    friend_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Remove a friend preference entry."""
    user_crud.remove_friend_preference(db, user_id=current_user.id, friend_id=friend_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    """Delete the authenticated account and clear session cookies."""
    user_crud.delete_user(db, current_user)
    response.delete_cookie(key=settings.auth_cookie_name)
    response.delete_cookie(key="thinky_session_hint")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response
