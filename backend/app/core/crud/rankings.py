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
from app.core.schemas.score import GameTopEntries, RankingEntry, UserGameRank

DEFAULT_RANKING_LIMIT = 50
DEFAULT_TOP_N = 3


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


def get_daily_top_n(
    db: Session, limit: int = DEFAULT_TOP_N
) -> list[GameTopEntries]:
    """Top N entries of today's leaderboard for every game with scores today."""
    starts_at = _period_start(RankingPeriod.DAILY)
    game_types = (
        db.query(Score.game_type)
        .filter(Score.created_at >= starts_at)
        .distinct()
        .all()
    )
    return [
        GameTopEntries(
            game_type=game_type,
            entries=_to_ranking_entries(
                _query_fastest_times(
                    db, game_type=game_type, starts_at=starts_at, limit=limit
                )
            ),
        )
        for (game_type,) in game_types
    ]


def get_user_ranks(db: Session, user_id: int) -> list[UserGameRank]:
    """The authenticated user's daily/monthly/global rank for every game they've played."""
    game_types = (
        db.query(Score.game_type)
        .filter(Score.user_id == user_id)
        .distinct()
        .all()
    )
    return [
        UserGameRank(
            game_type=game_type,
            daily_rank=_rank_of_user_best(
                db, user_id, game_type, RankingPeriod.DAILY
            ),
            monthly_rank=_rank_of_user_best(
                db, user_id, game_type, RankingPeriod.MONTHLY
            ),
            global_rank=_rank_of_user_best(
                db, user_id, game_type, RankingPeriod.GLOBAL
            ),
        )
        for (game_type,) in game_types
    ]


def _rank_of_user_best(
    db: Session, user_id: int, game_type: str, period: RankingPeriod
) -> int | None:
    """Position of the user's fastest time in a period's full leaderboard.

    Scans every score in the period (not just the top N), ordered fastest
    first, and returns the 1-based position of the user's first (i.e.
    fastest) row. ``None`` if the user has no scores in that window.
    """
    starts_at = _period_start(period)
    query = db.query(Score.user_id).filter(Score.game_type == game_type)
    if starts_at is not None:
        query = query.filter(Score.created_at >= starts_at)

    rows = query.order_by(
        Score.completion_time.asc(), Score.created_at.asc()
    ).all()

    for position, row in enumerate(rows, start=1):
        if row.user_id == user_id:
            return position
    return None
