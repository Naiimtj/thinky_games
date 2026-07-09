"""Server-side client for rae-api.com (Spanish dictionary definitions).

Used to enrich the Crossclimb word ladder with real RAE definitions as clues.
Every call soft-fails to ``None`` so callers can fall back to a curated puzzle.
Successful lookups are cached in-process to conserve the daily quota.

The API key (if any) is read from settings and sent as the ``X-API-Key`` header;
it is never logged.
"""

from __future__ import annotations

import json
import urllib.parse
import urllib.request

_BASE_URL = "https://rae-api.com/api"
_TIMEOUT_SECONDS = 5
_clue_cache: dict[str, str] = {}


def fetch_clue(word: str, api_key: str = "") -> str | None:
    """Return the first RAE definition of ``word``, or ``None`` on any failure."""
    key = word.lower()
    if key in _clue_cache:
        return _clue_cache[key]

    url = f"{_BASE_URL}/words/{urllib.parse.quote(key)}"
    request = urllib.request.Request(url)
    if api_key:
        request.add_header("X-API-Key", api_key)

    try:
        with urllib.request.urlopen(request, timeout=_TIMEOUT_SECONDS) as response:
            if response.status != 200:
                return None  # rate limit / server error — transient, don't cache
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:  # network/timeout/decode errors — transient, don't cache
        return None

    try:
        clue = payload["data"]["meanings"][0]["senses"][0]["description"]
    except (KeyError, IndexError, TypeError):
        clue = None
    if not isinstance(clue, str) or not clue:
        clue = None

    # Cache the definitive result (found or genuinely undefined) so the same
    # word is never queried twice — this bounds calls during bulk generation.
    _clue_cache[key] = clue
    return clue
