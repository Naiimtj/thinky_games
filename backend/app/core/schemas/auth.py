"""Authentication schemas."""

from pydantic import BaseModel


class Token(BaseModel):
    """Bearer token returned after a successful login."""

    access_token: str
    token_type: str = "bearer"
