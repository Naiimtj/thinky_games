"""Shared Spanish word list (lengths 3-5), loaded from bundled JSON.

Exported from the same dataset the frontend uses (``data/spanishWords.js``) so
both generate identical word puzzles. Regenerate ``data/spanish_words.json``
from the frontend if that list ever changes.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_DATA_PATH = Path(__file__).parent / "data" / "spanish_words.json"


@lru_cache(maxsize=1)
def words_by_length() -> dict[int, list[str]]:
    """Return a mapping of word length -> list of lowercase words."""
    raw = json.loads(_DATA_PATH.read_text(encoding="utf-8"))
    return {int(length): words for length, words in raw.items()}
