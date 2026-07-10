"""Score persistence use-cases."""

from collections import defaultdict
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.database.models import Score
from app.core.schemas.score import GameStatEntry, MyScoreEntry, ScoreCreate


def create_score(db: Session, user_id: int, payload: ScoreCreate) -> Score:
    """Persist a solved-puzzle time for the given user."""
    score = Score(
        user_id=user_id,
        game_type=payload.game_type,
        completion_time=payload.completion_time,
    )
    db.add(score)
    db.commit()
    db.refresh(score)
    return score


def has_played_today(db: Session, user_id: int, game_type: str) -> bool:
    """True when the user already submitted a score for this game today (UTC)."""
    return get_today_score(db, user_id=user_id, game_type=game_type) is not None


def get_today_score(db: Session, user_id: int, game_type: str) -> Score | None:
    """Return the user's score for this game today (UTC), if any.

    Used to make score submission idempotent: a game already won today must
    never insert a second row, no matter how many times the client retries.
    """
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    return (
        db.query(Score)
        .filter(
            Score.user_id == user_id,
            Score.game_type == game_type,
            Score.created_at >= today_start,
        )
        .first()
    )


def played_game_types_today(db: Session, user_id: int) -> list[str]:
    """Distinct game types the user already submitted a score for today (UTC)."""
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    rows = (
        db.query(Score.game_type)
        .filter(Score.user_id == user_id, Score.created_at >= today_start)
        .distinct()
        .all()
    )
    return [row.game_type for row in rows]


def get_user_scores(
    db: Session, user_id: int, game_type: str
) -> list[MyScoreEntry]:
    """The user's own scores for a game, fastest first, each ranked within their own history."""
    rows = (
        db.query(Score.completion_time, Score.created_at)
        .filter(Score.user_id == user_id, Score.game_type == game_type)
        .order_by(Score.completion_time.asc(), Score.created_at.asc())
        .all()
    )
    return [
        MyScoreEntry(
            rank=position,
            completion_time=row.completion_time,
            created_at=row.created_at,
        )
        for position, row in enumerate(rows, start=1)
    ]


def get_user_game_stats(db: Session, user_id: int) -> list[GameStatEntry]:
    """Per-game personal stats for every game the user has ever played.

    For each game type: whether it was played today (and the time, if so),
    the personal best/worst times across all history, and the trend of
    today's time against the average of the user's *previous* times.
    """
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)

    rows = (
        db.query(Score.game_type, Score.completion_time, Score.created_at)
        .filter(Score.user_id == user_id)
        .all()
    )

    by_game: dict[str, list] = defaultdict(list)
    for row in rows:
        by_game[row.game_type].append(row)

    stats = []
    for game_type, entries in sorted(by_game.items()):
        times = [entry.completion_time for entry in entries]
        today_entries = [e for e in entries if e.created_at >= today_start]
        previous_times = [
            e.completion_time for e in entries if e.created_at < today_start
        ]
        today_time = today_entries[0].completion_time if today_entries else None

        trend = None
        if today_time is not None and previous_times:
            average_previous = sum(previous_times) / len(previous_times)
            if today_time < average_previous:
                trend = "better"
            elif today_time > average_previous:
                trend = "worse"
            else:
                trend = "same"

        stats.append(
            GameStatEntry(
                game_type=game_type,
                played_today=today_time is not None,
                today_time=today_time,
                best_time=min(times),
                worst_time=max(times),
                average_time=sum(times) / len(times),
                trend=trend,
            )
        )
    return stats

