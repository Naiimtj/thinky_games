"""Seed initial reference data (idempotent — safe to run multiple times).

Loads the curated dictionary from JSON into ``dictionary_words`` while
skipping entries that already exist.
"""

import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.crud import dictionary as dictionary_crud
from app.core.schemas.dictionary import DictionaryWordCreate

DATA_DIR = Path(__file__).resolve().parent / "data"
DICTIONARY_SEED_FILE = DATA_DIR / "dictionary_seed.json"


def _load_dictionary_seed(db: Session) -> dict:
    """Import dictionary words from the bundled JSON seed file."""
    if not DICTIONARY_SEED_FILE.exists():
        return {"seeded": 0, "source": "missing"}

    raw_data = json.loads(DICTIONARY_SEED_FILE.read_text(encoding="utf-8"))
    payloads = []
    for entry in raw_data:
        payload = {
            "word": entry["word"],
            "display_word": entry["displayWord"],
            "normalized_word": entry["normalizedWord"],
            "definition": entry["definition"],
            "clue": entry["clue"],
            "category": entry["category"],
            "difficulty": entry["difficulty"],
            "length": entry["length"],
            "language": entry["language"],
            "is_common": entry["isCommon"],
            "suitable_for_children": entry["suitableForChildren"],
            "suitable_for_crossword": entry["suitableForCrossword"],
            "suitable_for_word_search": entry["suitableForWordSearch"],
            "contains_accent": entry["containsAccent"],
            "tags": entry["tags"],
        }
        payloads.append(DictionaryWordCreate(**payload))

    inserted = dictionary_crud.bulk_create_words(db, payloads)
    return {"seeded": inserted, "source": str(DICTIONARY_SEED_FILE)}


def run_seed(db: Session) -> dict:
    """Run all seed steps and report the number of dictionary words inserted."""
    dictionary_result = _load_dictionary_seed(db)
    return {
        "status": "ok",
        "dictionary": dictionary_result,
    }
