"""Score submission and leaderboard endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.crud import puzzles as puzzle_crud
from app.core.crud import scores as score_crud
from app.core.crud.rankings import (
    RankingPeriod,
    get_daily_top_n,
    get_rankings,
    get_user_ranks,
)
from app.core.database.models import User
from app.core.games.daily import utc_today
from app.core.games.registry import get_game
from app.core.schemas.score import (
    DailyPlayedGames,
    DailyStatus,
    GameStatEntry,
    GameTopEntries,
    MyScoreEntry,
    RankingEntry,
    ScoreCreate,
    ScorePublic,
    UserGameRank,
)
from app.dependencies import get_db

router = APIRouter(tags=["scores"])


@router.post(
    "/scores",
    response_model=ScorePublic,
    status_code=status.HTTP_201_CREATED,
)
def submit_score(
    payload: ScoreCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScorePublic:
    """Register the final completion time for the authenticated user.

    For games the backend generates (see the registry), the submitted solution
    is validated against today's puzzle before the score is accepted, so times
    can't be forged. Game types not yet ported skip validation.

    Idempotent: if the user already has a score for this game today, that
    existing row is returned instead of inserting a duplicate. This protects
    against double submissions from client retries, re-mounted components,
    etc.
    """
    existing = score_crud.get_today_score(
        db, user_id=current_user.id, game_type=payload.game_type
    )
    if existing is not None:
        return existing

    spec = get_game(payload.game_type)
    if spec is not None:
        puzzle = puzzle_crud.ensure_daily_puzzle(
            db, payload.game_type, utc_today()
        )
        if (
            payload.solution is None
            or puzzle is None
            or not spec.validate(puzzle.payload, payload.solution)
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid or missing solution for today's puzzle.",
            )
    return score_crud.create_score(db, user_id=current_user.id, payload=payload)


@router.get(
    "/scores/daily-status",
    response_model=DailyStatus,
)
def read_daily_status(
    game_type: str = Query(default="zip", max_length=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DailyStatus:
    """Tell the client whether the daily challenge was already solved today."""
    played_today = score_crud.has_played_today(
        db, user_id=current_user.id, game_type=game_type
    )
    return DailyStatus(played_today=played_today)


@router.get(
    "/scores/daily-played",
    response_model=DailyPlayedGames,
)
def read_daily_played_games(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DailyPlayedGames:
    """List every game type the authenticated user already solved today."""
    game_types = score_crud.played_game_types_today(db, user_id=current_user.id)
    return DailyPlayedGames(game_types=game_types)


@router.get(
    "/scores/daily-summary",
    response_model=list[GameStatEntry],
)
def read_daily_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[GameStatEntry]:
    """Per-game personal stats: today's time, trend vs average, best/worst."""
    return score_crud.get_user_game_stats(db, user_id=current_user.id)


@router.get(
    "/scores/me",
    response_model=list[MyScoreEntry],
)
def read_my_scores(
    game_type: str = Query(default="zip", max_length=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MyScoreEntry]:
    """The authenticated user's own scores for a game, fastest first."""
    return score_crud.get_user_scores(
        db, user_id=current_user.id, game_type=game_type
    )


@router.get(
    "/rankings",
    response_model=list[RankingEntry],
    dependencies=[Depends(get_current_user)],
)
def read_rankings(
    period: RankingPeriod = Query(default=RankingPeriod.GLOBAL),
    game_type: str = Query(default="zip", max_length=30),
    db: Session = Depends(get_db),
) -> list[RankingEntry]:
    """Return the leaderboard for the requested period. Requires authentication."""
    return get_rankings(db, period=period, game_type=game_type)


@router.get(
    "/rankings/me",
    response_model=list[UserGameRank],
)
def read_my_ranks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserGameRank]:
    """Daily/monthly/global rank of the authenticated user for every game they've played."""
    return get_user_ranks(db, user_id=current_user.id)


@router.get(
    "/rankings/daily-top",
    response_model=list[GameTopEntries],
    dependencies=[Depends(get_current_user)],
)
def read_daily_top(
    limit: int = Query(default=3, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[GameTopEntries]:
    """Top N entries of today's leaderboard for every game with scores today."""
    return get_daily_top_n(db, limit=limit)
