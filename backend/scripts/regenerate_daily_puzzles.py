#!/usr/bin/env python3
"""Regenerate daily puzzles for selected games and locales.

Usage:
    uv run python scripts/regenerate_daily_puzzles.py
    uv run python scripts/regenerate_daily_puzzles.py --games wend pinpoint crossword --days 14 --locales es en de
"""

from __future__ import annotations

import argparse
import logging
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config.env import get_settings
from app.core.crud.puzzles import (
    BUFFER_DAYS,
    _generate_and_store,
    get_daily_puzzle,
    get_game,
    puzzle_locales,
)
from app.core.database.database import SessionLocal
from app.core.games.daily import utc_today
from app.core.games.registry import PLAYABLE_GAMES

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("thinky-games")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Regenerate daily puzzles for selected games/locales.",
    )
    parser.add_argument(
        "--games",
        nargs="+",
        default=["wend", "pinpoint", "crossword"],
        help="Game IDs to regenerate (default: wend pinpoint crossword).",
    )
    parser.add_argument(
        "--locales",
        nargs="+",
        default=["es", "en", "de"],
        help="Locales to regenerate (default: es en de).",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=BUFFER_DAYS,
        help=f"Number of days ahead to generate (default: {BUFFER_DAYS}).",
    )
    parser.add_argument(
        "--delete-existing",
        action="store_true",
        help="Delete existing puzzles for the selected games/locales before regenerating.",
    )
    parser.add_argument(
        "--all-games",
        action="store_true",
        help="Regenerate all playable games instead of --games.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    settings = get_settings()

    if not settings.dictionary_service_url:
        logger.warning(
            "DICTIONARY_SERVICE_URL is not configured; puzzle generation will use "
            "small built-in fallback word pools."
        )

    games = [g for g in PLAYABLE_GAMES] if args.all_games else []
    if not args.all_games:
        for game_id in args.games:
            spec = get_game(game_id)
            if spec is None:
                logger.error("Unknown game: %s", game_id)
                return 1
            games.append(spec)

    today = utc_today()
    dates = [today + timedelta(days=offset) for offset in range(args.days + 1)]

    db = SessionLocal()
    try:
        if args.delete_existing:
            from app.core.database.models import DailyPuzzle

            game_ids = {spec.id for spec in games}
            locales = set(args.locales)
            deleted = (
                db.query(DailyPuzzle)
                .filter(
                    DailyPuzzle.game_type.in_(game_ids),
                    DailyPuzzle.locale.in_(locales),
                    DailyPuzzle.puzzle_date.in_(dates),
                )
                .delete(synchronize_session=False)
            )
            db.commit()
            logger.info("Deleted %s existing daily puzzles.", deleted)

        created = 0
        skipped = 0
        failed = 0

        for spec in games:
            for locale in puzzle_locales(spec.id):
                if locale not in args.locales:
                    continue
                for target_date in dates:
                    if not args.delete_existing and get_daily_puzzle(
                        db, spec.id, target_date, locale
                    ):
                        skipped += 1
                        continue
                    try:
                        _generate_and_store(db, spec, target_date, locale)
                        created += 1
                    except Exception:
                        db.rollback()
                        logger.exception(
                            "Failed to generate %s/%s for %s",
                            spec.id,
                            locale,
                            target_date,
                        )
                        failed += 1

        logger.info(
            "Finished: %s created, %s skipped, %s failed.",
            created,
            skipped,
            failed,
        )
    finally:
        db.close()

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
