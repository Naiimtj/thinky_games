"""Puzzle catalogue and daily puzzle delivery endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.crud import puzzles as puzzle_crud
from app.core.games.daily import utc_today
from app.core.games.localized_words import puzzle_locale
from app.core.games.registry import PLAYABLE_GAMES, get_game
from app.core.schemas.game import DailyPuzzleResponse, GameMeta
from app.dependencies import get_db

router = APIRouter(prefix="/games", tags=["games"])


@router.get("", response_model=list[GameMeta])
def list_games() -> list[GameMeta]:
    """List the games the backend can serve (used by the homepage)."""
    return [
        GameMeta(
            id=spec.id,
            name=spec.name,
            tagline=spec.tagline,
            emoji=spec.emoji,
            playable=spec.playable,
        )
        for spec in PLAYABLE_GAMES
    ]


@router.get("/{game_type}/daily", response_model=DailyPuzzleResponse)
def read_daily_puzzle(
    game_type: str,
    mode: str = Query(default="daily", pattern="^(daily|demo)$"),
    lang: str = Query(default="es", pattern="^(es|en|de)$"),
    db: Session = Depends(get_db),
) -> DailyPuzzleResponse:
    """Return today's puzzle for a game, or a stable demo puzzle.

    The response never contains the solution; win checking is done by submitting
    the solution to ``POST /scores``.
    """
    spec = get_game(game_type)
    if spec is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Unknown game"
        )

    if mode == "demo":
        generated = puzzle_crud.get_demo_puzzle(game_type, lang)
        return DailyPuzzleResponse(
            id=f"{game_type}-demo-{puzzle_locale(game_type, lang)}",
            game_type=game_type,
            locale=puzzle_locale(game_type, lang),
            mode="demo",
            date=None,
            seed=spec.demo_seed,
            payload=generated.payload,
            fallback=False,
        )

    puzzle, fallback = puzzle_crud.serve_daily_puzzle(
        db, game_type, utc_today(), lang
    )
    if puzzle is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No puzzle available",
        )
    return DailyPuzzleResponse(
        id=f"{game_type}-daily-{puzzle.locale}-{puzzle.seed}",
        game_type=game_type,
        locale=puzzle.locale,
        mode="daily",
        date=puzzle.puzzle_date,
        seed=puzzle.seed,
        payload=puzzle.payload,
        fallback=fallback,
    )
