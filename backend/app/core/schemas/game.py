"""Puzzle catalogue and daily puzzle delivery schemas."""

from datetime import date
from typing import Any

from pydantic import BaseModel


class GameMeta(BaseModel):
    """Metadata for a game shown on the homepage / used for routing."""

    id: str
    name: str
    tagline: str
    emoji: str
    playable: bool


class DailyPuzzleResponse(BaseModel):
    """A puzzle delivered to the client. Never includes the solution."""

    id: str
    game_type: str
    mode: str
    date: date | None
    seed: int
    payload: dict[str, Any]
    fallback: bool = False
