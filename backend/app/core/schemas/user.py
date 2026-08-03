"""User request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """Payload required to register a new user."""

    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    """Patch payload for account updates."""

    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserPublic(BaseModel):
    """User representation safe to expose through the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr
    avatar_url: str | None = None
    share_results_globally: bool
    created_at: datetime


class UserPrivacyUpdate(BaseModel):
    """Global sharing preference update payload."""

    share_results_globally: bool


class UserLookup(BaseModel):
    """Lightweight user payload for friend search results."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr


class FriendPreferenceCreate(BaseModel):
    """Create or upsert a per-friend sharing preference."""

    friend_id: int = Field(gt=0)
    share_times: bool = True


class FriendPreferenceUpdate(BaseModel):
    """Update a per-friend sharing preference."""

    share_times: bool


class FriendPreferencePublic(BaseModel):
    """Public representation of a per-friend sharing preference."""

    friend_id: int
    friend_username: str
    share_times: bool


class UserProfile(BaseModel):
    """Full profile payload for account settings screens."""

    id: int
    username: str
    email: EmailStr
    avatar_url: str | None = None
    share_results_globally: bool
    created_at: datetime
    friends: list[FriendPreferencePublic]
