"""Authentication endpoints: register and login."""

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.auth import create_access_token, get_current_user
from app.config.env import get_settings
from app.core.crud import users as user_crud
from app.core.database.models import User
from app.core.schemas.user import UserCreate, UserPublic
from app.dependencies import get_db

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> UserPublic:
    """Create a new user account."""
    return user_crud.register_user(db, payload)


@router.post("/login")
def login(
    response: Response,
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Create an HttpOnly session cookie after validating credentials."""
    user = user_crud.authenticate_user(db, form_data.username, form_data.password)
    access_token = create_access_token(subject=user.username)
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
    return {"message": "Login successful"}


@router.post("/logout")
def logout(response: Response) -> dict[str, str]:
    """Clear the authenticated session cookie."""
    response.delete_cookie(key=settings.auth_cookie_name)
    response.delete_cookie(key="thinky_session_hint")
    return {"message": "Logout successful"}


@router.get("/me", response_model=UserPublic)
def read_me(current_user: User = Depends(get_current_user)) -> UserPublic:
    """Return the profile of the currently authenticated user."""
    return current_user
