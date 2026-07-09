"""Daily puzzle persistence, the pre-generation buffer and fallback delivery.

The buffer pre-generates upcoming daily puzzles and stores them so that, if live
generation ever fails, players are still served the most recent stored puzzle
for a game. This keeps at least a handful of games playable until the problem is
fixed.
"""

from __future__ import annotations

import logging
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.core.database.models import DailyPuzzle
from app.core.games.base import GameSpec, GeneratedPuzzle
from app.core.games.daily import daily_seed, utc_today
from app.core.games.registry import PLAYABLE_GAMES, get_game

logger = logging.getLogger("thinky-games")

# How many upcoming days to keep pre-generated (today + BUFFER_DAYS ahead).
BUFFER_DAYS = 7
# Minimum number of games we aim to keep playable at all times.
MIN_FALLBACK_GAMES = 3

# Demo puzzles are stable (fixed seed) so we cache them in-process.
_demo_cache: dict[str, GeneratedPuzzle] = {}


def get_daily_puzzle(
    db: Session, game_type: str, target_date: date
) -> DailyPuzzle | None:
    """Return the stored puzzle for a game on a given date, if any."""
    return (
        db.query(DailyPuzzle)
        .filter(
            DailyPuzzle.game_type == game_type,
            DailyPuzzle.puzzle_date == target_date,
        )
        .first()
    )


def latest_puzzle(db: Session, game_type: str) -> DailyPuzzle | None:
    """Return the most recently dated stored puzzle for a game (fallback source)."""
    return (
        db.query(DailyPuzzle)
        .filter(DailyPuzzle.game_type == game_type)
        .order_by(DailyPuzzle.puzzle_date.desc())
        .first()
    )


def _generate_and_store(
    db: Session, spec: GameSpec, target_date: date
) -> DailyPuzzle:
    seed = daily_seed(target_date)
    generated = spec.generate(seed)
    puzzle = DailyPuzzle(
        game_type=spec.id,
        puzzle_date=target_date,
        seed=seed,
        payload=generated.payload,
        solution=generated.solution,
    )
    db.add(puzzle)
    db.commit()
    db.refresh(puzzle)
    return puzzle


def ensure_daily_puzzle(
    db: Session, game_type: str, target_date: date
) -> DailyPuzzle | None:
    """Return the stored puzzle for the date, generating and storing it if absent."""
    spec = get_game(game_type)
    if spec is None:
        return None
    existing = get_daily_puzzle(db, game_type, target_date)
    if existing is not None:
        return existing
    return _generate_and_store(db, spec, target_date)


def serve_daily_puzzle(
    db: Session, game_type: str, target_date: date
) -> tuple[DailyPuzzle | None, bool]:
    """Return ``(puzzle, is_fallback)`` for a game on a date.

    Generates today's puzzle on demand if the buffer hasn't produced it yet. If
    generation fails, falls back to the most recent stored puzzle so players are
    never left without a game.
    """
    spec = get_game(game_type)
    if spec is None:
        return None, False

    existing = get_daily_puzzle(db, game_type, target_date)
    if existing is not None:
        return existing, False

    try:
        return _generate_and_store(db, spec, target_date), False
    except Exception:  # pragma: no cover - defensive: keep serving on failure
        db.rollback()
        logger.exception(
            "Live generation failed for %s on %s; serving fallback",
            game_type,
            target_date,
        )
        fallback = latest_puzzle(db, game_type)
        return fallback, fallback is not None


def get_demo_puzzle(game_type: str) -> GeneratedPuzzle | None:
    """Return the stable demo puzzle for a game (cached in-process)."""
    spec = get_game(game_type)
    if spec is None:
        return None
    if game_type not in _demo_cache:
        _demo_cache[game_type] = spec.generate(spec.demo_seed)
    return _demo_cache[game_type]


def top_up_buffer(db: Session, days_ahead: int = BUFFER_DAYS) -> int:
    """Pre-generate puzzles for today + ``days_ahead`` days for playable games.

    Returns the number of puzzles created. Failures for one game/day are logged
    and skipped so a single bad generation never blocks the rest.
    """
    today = utc_today()
    created = 0
    for spec in PLAYABLE_GAMES:
        for offset in range(days_ahead + 1):
            target_date = today + timedelta(days=offset)
            if get_daily_puzzle(db, spec.id, target_date) is not None:
                continue
            try:
                _generate_and_store(db, spec, target_date)
                created += 1
            except Exception:  # pragma: no cover - defensive buffer guard
                db.rollback()
                logger.exception(
                    "Buffer generation failed for %s on %s", spec.id, target_date
                )
    return created
