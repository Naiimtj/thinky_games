"""Authentication endpoints: register and login."""

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.auth import create_access_token, get_current_user
from app.core.crud import users as user_crud
from app.core.database.models import User
from app.core.schemas.auth import Token
from app.core.schemas.user import UserCreate, UserPublic
from app.dependencies import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> UserPublic:
    """Create a new user account."""
    return user_crud.register_user(db, payload)


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    """Exchange username/password for a bearer access token."""
    user = user_crud.authenticate_user(db, form_data.username, form_data.password)
    access_token = create_access_token(subject=user.username)
    return Token(access_token=access_token)


@router.get("/me", response_model=UserPublic)
def read_me(current_user: User = Depends(get_current_user)) -> UserPublic:
    """Return the profile of the currently authenticated user."""
    return current_user
