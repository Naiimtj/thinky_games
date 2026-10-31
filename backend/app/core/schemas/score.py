"""Score and ranking schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

MAX_COMPLETION_SECONDS = 86_400  # a puzzle time above 24h is rejected as invalid
# These games store completion_time in milliseconds instead of seconds.
MILLISECOND_GAME_TYPES = frozenset({"pinpoint"})
MAX_COMPLETION_MILLISECONDS = MAX_COMPLETION_SECONDS * 1000


class ScoreCreate(BaseModel):
    """Payload sent by the client when a puzzle is solved."""

    completion_time: int = Field(
        gt=0,
        le=MAX_COMPLETION_MILLISECONDS,
        description=(
            "Time the player took to solve the puzzle: seconds, or milliseconds "
            "for the games in MILLISECOND_GAME_TYPES."
        ),
    )
    game_type: str = Field(default="zip", max_length=30)
    locale: str = Field(default="es", pattern="^(es|en|de)$")
    solution: Any | None = Field(
        default=None,
        description="Submitted solution, validated server-side for backend games.",
    )

    @model_validator(mode="after")
    def _check_max_time_for_unit(self) -> "ScoreCreate":
        if (
            self.game_type not in MILLISECOND_GAME_TYPES
            and self.completion_time > MAX_COMPLETION_SECONDS
        ):
            raise ValueError("completion_time exceeds 24 hours")
        return self


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


class GameStatEntry(BaseModel):
    """Per-game personal stats for the authenticated user.

    ``trend`` compares today's time against the average of the user's
    previous times for this game: "better", "worse", "same", or ``None``
    when there isn't enough history (no play today or no prior scores).
    """

    game_type: str
    played_today: bool
    today_time: int | None
    best_time: int
    worst_time: int
    average_time: float
    trend: str | None


class UserGameRank(BaseModel):
    """The authenticated user's own leaderboard position for a game.

    Each field is the position of the user's fastest time within that
    window's full leaderboard (not limited to the top N), or ``None`` when
    the user has no scores in that window.
    """

    game_type: str
    daily_rank: int | None
    monthly_rank: int | None
    global_rank: int | None


class MyScoreEntry(BaseModel):
    """A single one of the authenticated user's own scores for a game.

    ``rank`` is the position of this score among the user's own history for
    that game (1 = their personal best), ordered fastest first.
    """

    rank: int
    completion_time: int
    created_at: datetime


class GameTopEntries(BaseModel):
    """The top N leaderboard entries of the daily period for a single game."""

    game_type: str
    entries: list[RankingEntry]

