"""HTTP client for the external dictionary service."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import httpx

from app.config.env import get_settings

DEFAULT_TIMEOUT = 5.0


@dataclass(frozen=True)
class WordEntry:
    answer: str
    clue: str


@lru_cache
def _get_client() -> httpx.Client:
    settings = get_settings()
    return httpx.Client(
        base_url=settings.dictionary_service_url.rstrip("/"),
        timeout=DEFAULT_TIMEOUT,
    )


def _is_configured() -> bool:
    return bool(get_settings().dictionary_service_url)


def _request(method: str, path: str, **kwargs) -> httpx.Response:
    client = _get_client()
    response = client.request(method, path, **kwargs)
    response.raise_for_status()
    return response


def common_words(lang: str = "es") -> list[WordEntry]:
    """Return curated common words for the given locale.

    Falls back to an empty list when the service is not configured or unreachable.
    """
    if not _is_configured():
        return []

    try:
        response = _request(
            "GET",
            f"/words/{lang}",
            params={"limit": 1000, "is_common": True},
        )
    except Exception:  # pragma: no cover - network fallback
        return []

    items = response.json().get("items", [])
    return [
        WordEntry(
            answer=item["normalized_word"].upper(),
            clue=item["clue"],
        )
        for item in items
        if item.get("suitable_for_word_search")
    ]


def crossword_candidates(
    lang: str = "es",
    min_length: int = 5,
    max_length: int = 8,
) -> list[dict[str, str]]:
    """Return words suitable for crossword generation."""
    if not _is_configured():
        return []

    try:
        response = _request(
            "GET",
            f"/words/{lang}",
            params={
                "limit": 200,
                "suitable_for_crossword": True,
                "min_length": min_length,
                "max_length": max_length,
            },
        )
    except Exception:  # pragma: no cover - network fallback
        return []

    items = response.json().get("items", [])
    return [
        {"answer": item["normalized_word"].upper(), "clue": item["clue"]}
        for item in items
    ]


def fetch_clue(word: str, lang: str = "es") -> str | None:
    """Return a curated clue for a specific normalized word."""
    if not _is_configured():
        return None

    try:
        response = _request(
            "GET",
            f"/words/{lang}",
            params={"search": word.lower(), "limit": 1},
        )
    except Exception:  # pragma: no cover - network fallback
        return None

    items = response.json().get("items", [])
    for item in items:
        if item["normalized_word"] == word.lower():
            return item["clue"]
    return None
