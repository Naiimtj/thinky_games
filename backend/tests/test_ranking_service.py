"""Unit tests for the pure ranking calculations."""

from datetime import datetime, timedelta

from app.core.database.models import Score, User
from app.core.crud.rankings import (
    RankingPeriod,
    _period_start,
    get_rankings,
)


def _create_user(db_session) -> User:
    user = User(username="u", email="u@example.com", password_hash="x")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def _add_score(db_session, user_id, completion_time, created_at=None) -> None:
    score = Score(
        user_id=user_id,
        game_type="zip",
        completion_time=completion_time,
    )
    if created_at is not None:
        score.created_at = created_at
    db_session.add(score)
    db_session.commit()


def test_period_start_is_none_for_global():
    assert _period_start(RankingPeriod.GLOBAL) is None


def test_period_start_daily_is_midnight():
    start = _period_start(RankingPeriod.DAILY)

    assert (start.hour, start.minute, start.second) == (0, 0, 0)


def test_period_start_monthly_is_first_of_month():
    start = _period_start(RankingPeriod.MONTHLY)

    assert start.day == 1


def test_get_rankings_orders_by_fastest_time(db_session):
    user = _create_user(db_session)
    for completion_time in (95, 42, 60):
        _add_score(db_session, user.id, completion_time)

    entries = get_rankings(db_session, RankingPeriod.GLOBAL)

    assert [entry.completion_time for entry in entries] == [42, 60, 95]
    assert [entry.rank for entry in entries] == [1, 2, 3]


def test_daily_ranking_excludes_scores_from_previous_days(db_session):
    user = _create_user(db_session)
    _add_score(
        db_session,
        user.id,
        completion_time=10,
        created_at=datetime.utcnow() - timedelta(days=2),
    )

    daily = get_rankings(db_session, RankingPeriod.DAILY)
    global_board = get_rankings(db_session, RankingPeriod.GLOBAL)

    assert daily == []
    assert len(global_board) == 1


def test_rankings_are_limited(db_session):
    user = _create_user(db_session)
    for completion_time in range(1, 6):
        _add_score(db_session, user.id, completion_time)

    entries = get_rankings(db_session, RankingPeriod.GLOBAL, limit=3)

    assert len(entries) == 3
    assert [entry.completion_time for entry in entries] == [1, 2, 3]
