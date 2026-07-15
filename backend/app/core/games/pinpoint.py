"""Pinpoint: guess-the-category trivia (ported from the frontend).

Picks a daily category and five of its members as clues, then builds the options
from the answer plus four distinct distractor categories. Deterministic from a
seed. The answer is part of the payload because the board reveals clues on wrong
guesses client-side; the submitted answer is still validated server-side.

Locale-aware: the generator now reads categories from ``localized_words`` and
falls back to Spanish when no locale is supplied.
"""

from __future__ import annotations

from app.core.games.base import GeneratedPuzzle, Payload
from app.core.games.localized_words import pinpoint_categories
from app.core.games.prng import mulberry32, rand_int, shuffle_in_place

CLUE_COUNT = 5
OPTION_COUNT = 5
DEMO_SEED = 1

# Default Spanish categories kept for backward-compatible imports/tests.
PINPOINT_CATEGORIES: list[dict] = pinpoint_categories("es")


def _generate_puzzle(seed: int, lang: str = "es") -> Payload:
    rng = mulberry32(seed)
    categories = pinpoint_categories(lang)
    category = categories[rand_int(rng, len(categories))]

    clues = shuffle_in_place(list(category["members"]), rng)[:CLUE_COUNT]
    distractors = shuffle_in_place(
        [c["name"] for c in categories if c is not category], rng
    )[: OPTION_COUNT - 1]
    options = shuffle_in_place([category["name"], *distractors], rng)

    return {"clues": clues, "answer": category["name"], "options": options}


def validate(payload: Payload, solution: object) -> bool:
    """Whether the submitted category name matches the answer."""
    return isinstance(solution, str) and solution == payload["answer"]


def solve(payload: Payload) -> str:
    """Return the correct category name."""
    return payload["answer"]


def generate(seed: int, lang: str = "es") -> GeneratedPuzzle:
    """Deterministically generate a Pinpoint puzzle for ``seed``."""
    payload = _generate_puzzle(seed, lang)
    return GeneratedPuzzle(payload=payload, solution=payload["answer"])
