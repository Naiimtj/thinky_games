#!/usr/bin/env python3
"""Build a curated Spanish word dataset ready for direct DB import.

Uses the existing Wiktionary seed batches (scripts/data/seed_es_batch_*.json),
validates each entry against the dictionary-service schema, and writes a single
JSON file in snake_case that can be posted directly to:

    POST /words/es/import

Usage:
    uv run python scripts/build_spanish_word_dataset.py
    uv run python scripts/build_spanish_word_dataset.py --limit 15000
    uv run python scripts/build_spanish_word_dataset.py --output /tmp/spanish_words.json
"""

from __future__ import annotations

import argparse
import json
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.schemas.words import CATEGORIES, DIFFICULTY_LEVELS, WordCreate

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR / "data"
DEFAULT_OUTPUT = SCRIPT_DIR / "words_15k.json"
DEFAULT_LIMIT = 15_000
DEFAULT_LANGUAGE = "es"

_LANGUAGES: dict[str, str] = {
    "es": "español",
    "en": "English",
    "de": "Deutsch",
}


def _normalize(text: str) -> str:
    """Return lower-case form without diacritics (keep ñ)."""
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn")


def camel_to_snake(entry: dict) -> dict:
    """Convert camelCase seed keys to snake_case API keys."""
    mapping = {
        "displayWord": "display_word",
        "normalizedWord": "normalized_word",
        "isCommon": "is_common",
        "suitableForChildren": "suitable_for_children",
        "suitableForCrossword": "suitable_for_crossword",
        "suitableForWordSearch": "suitable_for_word_search",
        "containsAccent": "contains_accent",
    }
    return {mapping.get(k, k): v for k, v in entry.items()}


# Patterns that indicate the entry is a toponym, gentilic, or otherwise unsuitable.
import re

_TOPONYM_PATTERNS = [
    re.compile(r"^(es?|fue|era)\s+una\s+ciudad", re.IGNORECASE),
    re.compile(r"^ciudad\b", re.IGNORECASE),
    re.compile(r"^ciudad\s+(capital|de|del|en|situada|ubicada|enclavada|puerto)", re.IGNORECASE),
    re.compile(r"^capital\s+(de|del|de la)\b", re.IGNORECASE),
    re.compile(r"^localidad\b", re.IGNORECASE),
    re.compile(r"^municipio\b", re.IGNORECASE),
    re.compile(r"^poblaci[óo]n\b", re.IGNORECASE),
    re.compile(r"^poblado\b", re.IGNORECASE),
    re.compile(r"^pueblo\b", re.IGNORECASE),
    re.compile(r"^isla\b", re.IGNORECASE),
    re.compile(r"^entidad\s+de\s+poblaci[óo]n", re.IGNORECASE),
    re.compile(r"^persona\s+(natural|originaria|nacida|que\s+habita)\b", re.IGNORECASE),
    re.compile(r"^(natural|originario|originaria|relativo|perteneciente)\s+(a|al|de)\b", re.IGNORECASE),
    re.compile(r"^sector\s+de\s+poblaci[óo]n", re.IGNORECASE),
    re.compile(r"^provincia\s+(espa[ñn]ola|de|del)\b", re.IGNORECASE),
    re.compile(r"^departamento\s+de\b", re.IGNORECASE),
    re.compile(r"^estado\s+(de|del|mexicano)\b", re.IGNORECASE),
    re.compile(r"^nombre\s+(dado|tradicional|antiguo)\b", re.IGNORECASE),
    re.compile(r"^form(a|as?)\s+abreviada\s+de", re.IGNORECASE),
    re.compile(r"\b(estados unidos|reino unido)\b", re.IGNORECASE),
]

# Markers that the word is archaic, jargon or very rare.
_UNWANTED_MARKERS = (
    "arcaísmo",
    "arcaismo",
    "en desuso",
    "desusado",
    "poco usado",
    "poco frecuente",
    "jerga",
    "argot",
    "coloquial despectivo",
    "coloquialismo",
    "vulgar",
    "término médico",
    "término técnico",
    "término científico",
)

# Common first names, brands and acronyms to skip when they appear as the word itself.
_NAME_LIKE_WORDS = {
    "jesús", "jesus", "maría", "maria", "josé", "jose", "juan", "pedro", "pablo",
    "manuel", "antonio", "francisco", "luis", "carlos", "miguel", "rafael",
    "fernando", "alberto", "adidas", "nike", "coca", "pepsi", "sony", "apple",
    "google", "microsoft", "ibm", "hp", "lg", "samsung",
}

# Fragments that make an entry unsuitable for family / educational games.
_UNWANTED_FRAGMENTS: dict[str, set[str]] = {
    "es": {
        "vulgar", "ofensivo", "despectivo", "insulto", "malsonante", "sexo", "sexual",
        "pene", "vagina", "masturb", "excremento", "defecar", "orinar", "violación",
        "violador", "asesinar", "asesino", "matar", "muerte", "cadáver", "tortura",
        "droga", "cocaína", "heroína", "marihuana", "opio", "extasis", "éxtasis",
    },
    "en": {
        "vulgar", "offensive", "derogatory", "insult", "profanity", "sexual", "sex organ",
        "penis", "vagina", "masturb", "excrement", "defecat", "urinat", "rape", "rapist",
        "murder", "kill", "death", "corpse", "torture", "drug", "cocaine", "heroin",
        "marijuana", "opium", "ecstasy",
    },
    "de": {
        "vulgär", "beleidigend", "abwertend", "beleidigung", "sexuell", "geschlechtsorgan",
        "penis", "vagina", "masturb", "kot", "defäk", "urin", "vergewaltigung", "vergewaltiger",
        "mord", "töten", "tod", "leiche", "folter", "droge", "kokain", "heroin",
        "marihuana", "opium", "extasy", "ekstase",
    },
}


def is_suitable(entry: dict, lang: str = DEFAULT_LANGUAGE) -> bool:
    """Reject entries that are not suitable for family/educational games."""
    word = entry.get("word", "")
    display = entry.get("display_word", "")
    definition = (entry.get("definition") or "").lower()
    clue = (entry.get("clue") or "").lower()

    # No proper nouns or uppercase words.
    if word and word[0].isupper():
        return False
    if display and display[0].isupper():
        return False

    # Keep only plain single words.
    if " " in word or "-" in word or "/" in word:
        return False

    # Skip common first names / brands used as lemmas.
    if word.lower() in _NAME_LIKE_WORDS or display.lower() in _NAME_LIKE_WORDS:
        return False

    # Drop toponyms and gentilics.
    if any(pattern.search(definition) for pattern in _TOPONYM_PATTERNS):
        return False

    # Drop archaic, jargon or very rare words.
    if any(marker in definition for marker in _UNWANTED_MARKERS):
        return False

    # Drop definitions that are pure grammatical constructs.
    if definition.startswith("{{"):
        return False

    text = f"{word} {display} {definition} {clue}"
    fragments = _UNWANTED_FRAGMENTS.get(lang, _UNWANTED_FRAGMENTS["en"])
    if any(fragment in text for fragment in fragments):
        return False

    return True


def load_and_validate_batches(limit: int, lang: str) -> list[dict]:
    """Read existing seed batches, validate and deduplicate entries."""
    batch_paths = sorted(DATA_DIR.glob(f"seed_{lang}_batch_*.json"))
    if not batch_paths:
        raise FileNotFoundError(f"No seed batches found in {DATA_DIR}")

    entries: list[dict] = []
    seen: set[str] = set()
    invalid_reasons: dict[str, int] = {}

    for path in batch_paths:
        if len(entries) >= limit:
            break

        raw = json.loads(path.read_text(encoding="utf-8"))
        for item in raw:
            if len(entries) >= limit:
                break

            # Convert from camelCase to snake_case if necessary.
            if "displayWord" in item:
                item = camel_to_snake(item)

            normalized = (item.get("normalized_word") or item.get("word", "")).lower().strip()
            if not normalized or normalized in seen:
                continue

            # Normalize category/difficulty/length consistency.
            item["category"] = item.get("category", "objetos").lower()
            item["difficulty"] = item.get("difficulty", "easy").lower()
            item["length"] = len(normalized)
            item["word"] = normalized
            item.setdefault("display_word", item.get("word", normalized))
            item.setdefault("normalized_word", normalized)
            item.setdefault("language", lang)
            item.setdefault("is_common", True)
            item.setdefault("suitable_for_children", True)
            item.setdefault("suitable_for_crossword", True)
            item.setdefault("suitable_for_word_search", True)
            item.setdefault("contains_accent", item.get("display_word", normalized) != normalized)
            item.setdefault("tags", [])

            if not is_suitable(item, lang):
                invalid_reasons["suitability"] = invalid_reasons.get("suitability", 0) + 1
                continue

            if item["category"] not in CATEGORIES:
                invalid_reasons["category"] = invalid_reasons.get("category", 0) + 1
                continue

            if item["difficulty"] not in DIFFICULTY_LEVELS:
                invalid_reasons["difficulty"] = invalid_reasons.get("difficulty", 0) + 1
                continue

            try:
                WordCreate.model_validate(item)
            except Exception as exc:
                invalid_reasons["schema"] = invalid_reasons.get("schema", 0) + 1
                # Uncomment to debug individual failures.
                # print(f"Schema error for {normalized!r}: {exc}")
                continue

            seen.add(normalized)
            entries.append(item)

    print(f"Language:         {lang} ({_LANGUAGES.get(lang, lang)})")
    print(f"Batches read:     {len(batch_paths)}")
    print(f"Valid entries:    {len(entries)}")
    print(f"Invalid reasons:  {invalid_reasons}")
    return entries


def write_dataset(entries: list[dict], output_path: Path) -> None:
    """Write the validated dataset as a single JSON array."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(entries)} entries to {output_path}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build a curated word dataset from existing Wiktionary seeds.",
    )
    parser.add_argument(
        "--language",
        choices=["es", "en", "de"],
        default=DEFAULT_LANGUAGE,
        help="Language to build the dataset for (default: es).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_LIMIT,
        help=f"Maximum number of words to include (default: {DEFAULT_LIMIT}).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output JSON file path (default: <language>_words_15k.json).",
    )
    args = parser.parse_args()

    lang = args.language
    output_path = args.output or SCRIPT_DIR / f"{lang}_words_15k.json"

    entries = load_and_validate_batches(args.limit, lang)
    write_dataset(entries, output_path)

    # Print a tiny sample for quick inspection.
    if entries:
        print("\nSample entries:")
        for entry in entries[:3]:
            print(
                f"  {entry['display_word']:<16} "
                f"({entry['category']:<12} {entry['difficulty']:<6}) "
                f"{entry['clue'][:60]}..."
            )
    else:
        print("No entries produced.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
