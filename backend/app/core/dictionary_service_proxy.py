"""Proxy helpers to forward dictionary CRUD to the dictionary service."""

from __future__ import annotations

import httpx
from fastapi import HTTPException, status

from app.config.env import get_settings

DEFAULT_TIMEOUT = 10.0


def _client() -> httpx.Client:
    settings = get_settings()
    return httpx.Client(
        base_url=settings.dictionary_service_url.rstrip("/"),
        timeout=DEFAULT_TIMEOUT,
        headers={"X-Admin-Password": settings.dictionary_service_admin_password},
    )


def _enabled() -> bool:
    return bool(get_settings().dictionary_service_url)


def _raise_for_status(response: httpx.Response) -> None:
    if response.status_code == status.HTTP_404_NOT_FOUND:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found in dictionary service",
        )
    if response.status_code == status.HTTP_409_CONFLICT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Word already exists in dictionary service",
        )
    response.raise_for_status()


def proxy_list(
    language: str,
    params: dict,
) -> dict:
    """Forward list request to dictionary service."""
    with _client() as client:
        response = client.get(f"/words/{language}", params=params)
        _raise_for_status(response)
        return response.json()


def proxy_count(language: str) -> dict[str, int]:
    with _client() as client:
        response = client.get(f"/words/{language}/count")
        _raise_for_status(response)
        return response.json()


def proxy_get(word_id: int, language: str) -> dict:
    with _client() as client:
        response = client.get(f"/words/{language}/{word_id}")
        _raise_for_status(response)
        return response.json()


def proxy_create(language: str, payload: dict) -> dict:
    with _client() as client:
        response = client.post(f"/words/{language}", json=payload)
        _raise_for_status(response)
        return response.json()


def proxy_import(language: str, payload: list[dict]) -> dict:
    with _client() as client:
        response = client.post(f"/words/{language}/import", json=payload)
        _raise_for_status(response)
        return response.json()


def proxy_update(word_id: int, language: str, payload: dict) -> dict:
    with _client() as client:
        response = client.patch(f"/words/{language}/{word_id}", json=payload)
        _raise_for_status(response)
        return response.json()


def proxy_delete(word_id: int, language: str) -> None:
    with _client() as client:
        response = client.delete(f"/words/{language}/{word_id}")
        _raise_for_status(response)
