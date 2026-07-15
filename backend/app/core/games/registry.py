"""Catalogue of backend games and dispatch to their generators/validators.

Single source of truth for which games the backend can generate, validate and
serve. Mirrors the frontend ``games/registry.jsx`` entries that have been ported
to the backend so far.
"""

from __future__ import annotations

from app.core.games import crossword, patches, pinpoint, queens, sudoku, tango, wend
from app.core.games import zip as zip_puzzle
from app.core.games.base import GameSpec

GAMES: dict[str, GameSpec] = {
    "queens": GameSpec(
        id="queens",
        name="Queens",
        tagline="Corona cada región",
        emoji="👑",
        playable=True,
        demo_seed=queens.DEMO_SEED,
        generate=queens.generate,
        validate=queens.validate,
        solve=queens.solve,
    ),
    "zip": GameSpec(
        id="zip",
        name="Zip",
        tagline="Une los números en un solo trazo",
        emoji="🔗",
        playable=True,
        demo_seed=zip_puzzle.DEMO_SEED,
        generate=zip_puzzle.generate,
        validate=zip_puzzle.validate,
        solve=zip_puzzle.solve,
    ),
    "tango": GameSpec(
        id="tango",
        name="Tango",
        tagline="Armoniza la rejilla",
        emoji="🌗",
        playable=True,
        demo_seed=tango.DEMO_SEED,
        generate=tango.generate,
        validate=tango.validate,
        solve=tango.solve,
    ),
    "sudoku": GameSpec(
        id="sudoku",
        name="Mini Sudoku",
        tagline="Rellena del 1 al 6",
        emoji="🔢",
        playable=True,
        demo_seed=sudoku.DEMO_SEED,
        generate=sudoku.generate,
        validate=sudoku.validate,
        solve=sudoku.solve,
    ),
    "pinpoint": GameSpec(
        id="pinpoint",
        name="Pinpoint",
        tagline="Adivina la categoría",
        emoji="🎯",
        playable=True,
        demo_seed=pinpoint.DEMO_SEED,
        generate=pinpoint.generate,
        validate=pinpoint.validate,
        solve=pinpoint.solve,
    ),
    "crossword": GameSpec(
        id="crossword",
        name="Crucigrama",
        tagline="Completa la rejilla",
        emoji="✏️",
        playable=True,
        demo_seed=crossword.DEMO_SEED,
        generate=crossword.generate,
        validate=crossword.validate,
        solve=crossword.solve,
        generate_daily=crossword.generate_for_date,
    ),
    "wend": GameSpec(
        id="wend",
        name="Wend",
        tagline="Ábrete paso entre palabras",
        emoji="🔤",
        playable=True,
        demo_seed=wend.DEMO_SEED,
        generate=wend.generate,
        validate=wend.validate,
        solve=wend.solve,
    ),
    "patches": GameSpec(
        id="patches",
        name="Patches",
        tagline="¡A darle forma!",
        emoji="🧩",
        playable=True,
        demo_seed=patches.DEMO_SEED,
        generate=patches.generate,
        validate=patches.validate,
        solve=patches.solve,
    ),
}

PLAYABLE_GAMES: list[GameSpec] = [spec for spec in GAMES.values() if spec.playable]


def get_game(game_id: str) -> GameSpec | None:
    """Return the game spec for ``game_id`` or ``None`` if it isn't a backend game."""
    return GAMES.get(game_id)
