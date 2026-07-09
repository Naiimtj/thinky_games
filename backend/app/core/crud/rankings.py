"""Ranking calculations.

These functions are the single source of truth for how leaderboards are
built. They stay free of HTTP concerns so they can be reused and unit tested.
Every ranking is ordered by ``completion_time`` ascending: the smaller the
time, the higher the position.
"""

from datetime import datetime
from enum import Enum

from sqlalchemy.orm import Session

from app.core.database.models import Score, User
from app.core.schemas.score import RankingEntry

DEFAULT_RANKING_LIMIT = 50


class RankingPeriod(str, Enum):
    """Supported leaderboard windows."""

    DAILY = "daily"
    MONTHLY = "monthly"
    GLOBAL = "global"


def get_rankings(
    db: Session,
    period: RankingPeriod,
    game_type: str = "zip",
    limit: int = DEFAULT_RANKING_LIMIT,
) -> list[RankingEntry]:
    """Return the fastest times for a period as ranked leaderboard entries."""
    starts_at = _period_start(period)
    rows = _query_fastest_times(db, game_type=game_type, starts_at=starts_at, limit=limit)
    return _to_ranking_entries(rows)


def _period_start(period: RankingPeriod) -> datetime | None:
    """Return the inclusive lower time bound for a period (None for global)."""
    now = datetime.utcnow()
    if period is RankingPeriod.DAILY:
        return datetime(now.year, now.month, now.day)
    if period is RankingPeriod.MONTHLY:
        return datetime(now.year, now.month, 1)
    return None


def _query_fastest_times(
    db: Session,
    game_type: str,
    starts_at: datetime | None,
    limit: int,
):
    """Fetch the fastest scores, ordered by completion time ascending."""
    query = (
        db.query(Score.completion_time, Score.created_at, User.username)
        .join(User, User.id == Score.user_id)
        .filter(Score.game_type == game_type)
    )
    if starts_at is not None:
        query = query.filter(Score.created_at >= starts_at)

    return (
        query.order_by(Score.completion_time.asc(), Score.created_at.asc())
        .limit(limit)
        .all()
    )


def _to_ranking_entries(rows) -> list[RankingEntry]:
    """Map database rows to ranking entries, assigning positions from 1."""
    return [
        RankingEntry(
            rank=position,
            username=row.username,
            completion_time=row.completion_time,
            created_at=row.created_at,
        )
        for position, row in enumerate(rows, start=1)
    ]
