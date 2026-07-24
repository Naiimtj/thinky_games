"""Import seed words into the dictionary service.

Usage:
    uv run python scripts/import_seed.py data/seed_es.json es
"""

import json
import sys
import urllib.request
from pathlib import Path

BASE_URL = "http://127.0.0.1:8100"
ADMIN_PASSWORD = "thinky"


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
    result = {}
    for key, value in entry.items():
        result[mapping.get(key, key)] = value
    return result


def import_file(path: Path, language: str) -> None:
    raw = json.loads(path.read_text(encoding="utf-8"))
    payload = [camel_to_snake(entry) for entry in raw]

    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{BASE_URL}/words/{language}/import",
        data=data,
        headers={
            "Content-Type": "application/json",
            "X-Admin-Password": ADMIN_PASSWORD,
        },
        method="POST",
    )
    with urllib.request.urlopen(request) as response:
        print(json.loads(response.read().decode("utf-8")))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <seed.json> <language>")
        sys.exit(1)
    import_file(Path(sys.argv[1]), sys.argv[2])
