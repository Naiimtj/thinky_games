"""Score persistence use-cases."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.core.database.models import Score
from app.core.schemas.score import ScoreCreate


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

