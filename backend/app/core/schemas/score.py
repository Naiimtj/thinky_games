"""Score and ranking schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

MAX_COMPLETION_SECONDS = 86_400  # a puzzle time above 24h is rejected as invalid


class ScoreCreate(BaseModel):
    """Payload sent by the client when a puzzle is solved."""

    completion_time: int = Field(
        gt=0,
        le=MAX_COMPLETION_SECONDS,
        description="Seconds the player took to solve the puzzle.",
    )
    game_type: str = Field(default="zip", max_length=30)
    solution: Any | None = Field(
        default=None,
        description="Submitted solution, validated server-side for backend games.",
    )


class ScorePublic(BaseModel):
    """Persisted score returned to the client."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    game_type: str
    completion_time: int
    created_at: datetime


class RankingEntry(BaseModel):
    """A single row of a leaderboard, ordered by fastest time first."""

    rank: int
    username: str
    completion_time: int
    created_at: datetime


class DailyStatus(BaseModel):
    """Whether the authenticated user already solved today's daily puzzle."""

    played_today: bool


class DailyPlayedGames(BaseModel):
    """Game types the authenticated user already solved today."""

    game_types: list[str]

