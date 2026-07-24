"""Dictionary word API — proxies to the external dictionary service.

The local ``dictionary_words`` table is kept for backwards compatibility but
is no longer used by word games. When ``DICTIONARY_SERVICE_URL`` is configured,
all CRUD operations are forwarded to the dictionary service.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config.env import get_settings
from app.core.auth import require_admin_password
from app.core import dictionary_service_proxy as proxy
from app.dependencies import get_db

router = APIRouter(prefix="/dictionary", tags=["dictionary"])


class DictionaryListResponse(BaseModel):
    """Paginated list of dictionary words."""

    total: int
    skip: int
    limit: int
    items: list[dict]


class BulkImportResponse(BaseModel):
    """Result of a bulk dictionary import."""

    inserted: int
    total_received: int


def _default_language() -> str:
    return "es"


def _require_service() -> None:
    if not get_settings().dictionary_service_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dictionary service not configured",
        )


@router.get("", response_model=DictionaryListResponse)
def list_words(
    language: str = Query(default="es", min_length=2, max_length=2),
    category: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    min_length: int | None = Query(default=None, ge=3, le=12),
    max_length: int | None = Query(default=None, ge=3, le=12),
    suitable_for_crossword: bool | None = Query(default=None),
    suitable_for_word_search: bool | None = Query(default=None),
    suitable_for_children: bool | None = Query(default=None),
    is_common: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),  # noqa: ARG001 — kept for route signature
) -> DictionaryListResponse:
    """List curated dictionary words with optional filters (proxied)."""
    _require_service()
    params = {
        "category": category,
        "difficulty": difficulty,
        "min_length": min_length,
        "max_length": max_length,
        "suitable_for_crossword": suitable_for_crossword,
        "suitable_for_word_search": suitable_for_word_search,
        "suitable_for_children": suitable_for_children,
        "is_common": is_common,
        "search": search,
        "skip": skip,
        "limit": limit,
    }
    params = {key: value for key, value in params.items() if value is not None}
    return DictionaryListResponse(**proxy.proxy_list(language, params))


@router.get("/count")
def count_words(
    language: str = Query(default="es", min_length=2, max_length=2),
    db: Session = Depends(get_db),  # noqa: ARG001 — kept for route signature
) -> dict[str, object]:
    """Return the current number of words for a language (proxied)."""
    _require_service()
    return proxy.proxy_count(language)


@router.get("/{word_id}")
def get_word(
    word_id: int,
    language: str = Query(default="es", min_length=2, max_length=2),
    db: Session = Depends(get_db),  # noqa: ARG001 — kept for route signature
) -> dict:
    """Return a single dictionary word by ID and language (proxied)."""
    _require_service()
    return proxy.proxy_get(word_id, language)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin_password)],
)
def create_word(
    payload: dict,
    language: str = Query(default="es", min_length=2, max_length=2),
    db: Session = Depends(get_db),  # noqa: ARG001 — kept for route signature
) -> dict:
    """Create a new dictionary word (admin only, proxied)."""
    _require_service()
    return proxy.proxy_create(language, payload)


@router.post(
    "/import",
    response_model=BulkImportResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin_password)],
)
def import_words(
    payload: list[dict],
    language: str = Query(default="es", min_length=2, max_length=2),
    db: Session = Depends(get_db),  # noqa: ARG001 — kept for route signature
) -> BulkImportResponse:
    """Import a batch of dictionary words (admin only, proxied)."""
    _require_service()
    return BulkImportResponse(**proxy.proxy_import(language, payload))


@router.patch(
    "/{word_id}",
    dependencies=[Depends(require_admin_password)],
)
def update_word(
    word_id: int,
    payload: dict,
    language: str = Query(default="es", min_length=2, max_length=2),
    db: Session = Depends(get_db),  # noqa: ARG001 — kept for route signature
) -> dict:
    """Update an existing dictionary word (admin only, proxied)."""
    _require_service()
    return proxy.proxy_update(word_id, language, payload)


@router.delete(
    "/{word_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin_password)],
)
def delete_word(
    word_id: int,
    language: str = Query(default="es", min_length=2, max_length=2),
    db: Session = Depends(get_db),  # noqa: ARG001 — kept for route signature
) -> None:
    """Delete a dictionary word (admin only, proxied)."""
    _require_service()
    proxy.proxy_delete(word_id, language)
