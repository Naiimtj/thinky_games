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
from app.core.games.localized_words import puzzle_locale, puzzle_locales
from app.core.games.registry import PLAYABLE_GAMES, get_game

logger = logging.getLogger("thinky-games")

# How many upcoming days to keep pre-generated (today + BUFFER_DAYS ahead).
BUFFER_DAYS = 7
# Minimum number of games we aim to keep playable at all times.
MIN_FALLBACK_GAMES = 3

# Demo puzzles are stable (fixed seed) so we cache them in-process per locale.
_demo_cache: dict[tuple[str, str], GeneratedPuzzle] = {}


def get_daily_puzzle(
    db: Session, game_type: str, target_date: date, locale: str = "es"
) -> DailyPuzzle | None:
    """Return the stored puzzle for a game on a given date, if any."""
    locale = puzzle_locale(game_type, locale)
    return (
        db.query(DailyPuzzle)
        .filter(
            DailyPuzzle.game_type == game_type,
            DailyPuzzle.locale == locale,
            DailyPuzzle.puzzle_date == target_date,
        )
        .first()
    )


def latest_puzzle(
    db: Session, game_type: str, locale: str = "es"
) -> DailyPuzzle | None:
    """Return the most recently dated stored puzzle for a game (fallback source)."""
    locale = puzzle_locale(game_type, locale)
    return (
        db.query(DailyPuzzle)
        .filter(
            DailyPuzzle.game_type == game_type,
            DailyPuzzle.locale == locale,
        )
        .order_by(DailyPuzzle.puzzle_date.desc())
        .first()
    )


def _generate_and_store(
    db: Session, spec: GameSpec, target_date: date, locale: str = "es"
) -> DailyPuzzle:
    locale = puzzle_locale(spec.id, locale)
    seed = daily_seed(target_date)
    if spec.generate_daily is not None:
        generated = spec.generate_daily(seed, locale, target_date)
    elif len(puzzle_locales(spec.id)) > 1:
        generated = spec.generate(seed, locale)
    else:
        generated = spec.generate(seed)
    puzzle = DailyPuzzle(
        game_type=spec.id,
        locale=locale,
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
    db: Session, game_type: str, target_date: date, locale: str = "es"
) -> DailyPuzzle | None:
    """Return the stored puzzle for the date, generating and storing it if absent."""
    spec = get_game(game_type)
    if spec is None:
        return None
    locale = puzzle_locale(game_type, locale)
    existing = get_daily_puzzle(db, game_type, target_date, locale)
    if existing is not None:
        return existing
    return _generate_and_store(db, spec, target_date, locale)


def serve_daily_puzzle(
    db: Session, game_type: str, target_date: date, locale: str = "es"
) -> tuple[DailyPuzzle | None, bool]:
    """Return ``(puzzle, is_fallback)`` for a game on a date.

    Generates today's puzzle on demand if the buffer hasn't produced it yet. If
    generation fails, falls back to the most recent stored puzzle so players are
    never left without a game.
    """
    spec = get_game(game_type)
    if spec is None:
        return None, False

    locale = puzzle_locale(game_type, locale)
    existing = get_daily_puzzle(db, game_type, target_date, locale)
    if existing is not None:
        return existing, False

    try:
        return _generate_and_store(db, spec, target_date, locale), False
    except Exception:  # pragma: no cover - defensive: keep serving on failure
        db.rollback()
        logger.exception(
            "Live generation failed for %s on %s; serving fallback",
            game_type,
            target_date,
        )
        fallback = latest_puzzle(db, game_type, locale)
        return fallback, fallback is not None


def get_demo_puzzle(game_type: str, locale: str = "es") -> GeneratedPuzzle | None:
    """Return the stable demo puzzle for a game (cached in-process)."""
    spec = get_game(game_type)
    if spec is None:
        return None
    locale = puzzle_locale(game_type, locale)
    cache_key = (game_type, locale)
    if cache_key not in _demo_cache:
        _demo_cache[cache_key] = (
            spec.generate(spec.demo_seed, locale)
            if len(puzzle_locales(game_type)) > 1
            else spec.generate(spec.demo_seed)
        )
    return _demo_cache[cache_key]


def top_up_buffer(db: Session, days_ahead: int = BUFFER_DAYS) -> int:
    """Pre-generate puzzles for today + ``days_ahead`` days for playable games.

    Returns the number of puzzles created. Failures for one game/day are logged
    and skipped so a single bad generation never blocks the rest.
    """
    today = utc_today()
    created = 0
    for spec in PLAYABLE_GAMES:
        for locale in puzzle_locales(spec.id):
            for offset in range(days_ahead + 1):
                target_date = today + timedelta(days=offset)
                if get_daily_puzzle(db, spec.id, target_date, locale) is not None:
                    continue
                try:
                    _generate_and_store(db, spec, target_date, locale)
                    created += 1
                except Exception:  # pragma: no cover - defensive buffer guard
                    db.rollback()
                    logger.exception(
                        "Buffer generation failed for %s (%s) on %s",
                        spec.id,
                        locale,
                        target_date,
                    )
    return created
