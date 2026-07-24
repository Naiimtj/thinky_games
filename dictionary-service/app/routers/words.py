"""Dictionary word API with one sub-resource per language."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth import require_admin_password
from app.core.crud import words as words_crud
from app.core.database import get_db
from app.core.database.models import LANGUAGE_MODELS
from app.core.schemas import (
    BulkImportResponse,
    WordCreate,
    WordListResponse,
    WordResponse,
    WordUpdate,
)

router = APIRouter(prefix="/words", tags=["words"])


def _validate_language(language: str) -> str:
    """Return a lowercased supported language code or raise 400."""
    code = language.lower()
    if code not in LANGUAGE_MODELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language. Supported: {sorted(LANGUAGE_MODELS)}",
        )
    return code


@router.get("/{language}", response_model=WordListResponse)
def list_words(
    language: str,
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
    db: Session = Depends(get_db),
) -> WordListResponse:
    """List curated words for a language with optional filters."""
    code = _validate_language(language)
    items, total = words_crud.list_words(
        db,
        code,
        category=category,
        difficulty=difficulty,
        min_length=min_length,
        max_length=max_length,
        suitable_for_crossword=suitable_for_crossword,
        suitable_for_word_search=suitable_for_word_search,
        suitable_for_children=suitable_for_children,
        is_common=is_common,
        search=search,
        skip=skip,
        limit=limit,
    )
    return WordListResponse(
        total=total,
        skip=skip,
        limit=limit,
        language=code,
        items=[_with_language(item, code) for item in items],
    )


@router.get("/{language}/count")
def count_words(
    language: str,
    db: Session = Depends(get_db),
) -> dict[str, object]:
    """Return the current number of words for a language."""
    code = _validate_language(language)
    return {"count": words_crud.count_words(db, code), "language": code}


@router.get("/{language}/count/all")
def count_all_words(
    db: Session = Depends(get_db),
) -> dict[str, int]:
    """Return word counts for all supported languages."""
    return words_crud.count_words(db)


@router.get("/{language}/{word_id}", response_model=WordResponse)
def get_word(
    language: str,
    word_id: int,
    db: Session = Depends(get_db),
) -> WordResponse:
    """Return a single word by language and ID."""
    code = _validate_language(language)
    word = words_crud.get_word(db, code, word_id)
    if word is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found",
        )
    return _with_language(word, code)


@router.post(
    "/{language}",
    response_model=WordResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin_password)],
)
def create_word(
    language: str,
    payload: WordCreate,
    db: Session = Depends(get_db),
) -> WordResponse:
    """Create a new word for a language (admin only)."""
    code = _validate_language(language)
    existing = words_crud.get_word_by_normalized(
        db,
        code,
        payload.normalized_word,
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A word with this normalized form already exists",
        )
    word = words_crud.create_word(db, code, payload)
    return _with_language(word, code)


@router.post(
    "/{language}/import",
    response_model=BulkImportResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin_password)],
)
def import_words(
    language: str,
    payload: list[WordCreate],
    db: Session = Depends(get_db),
) -> BulkImportResponse:
    """Import a batch of words, skipping duplicates (admin only)."""
    code = _validate_language(language)
    inserted = words_crud.bulk_create_words(db, code, payload)
    return BulkImportResponse(
        inserted=inserted,
        total_received=len(payload),
        language=code,
    )


@router.patch(
    "/{language}/{word_id}",
    response_model=WordResponse,
    dependencies=[Depends(require_admin_password)],
)
def update_word(
    language: str,
    word_id: int,
    payload: WordUpdate,
    db: Session = Depends(get_db),
) -> WordResponse:
    """Update an existing word (admin only)."""
    code = _validate_language(language)
    word = words_crud.get_word(db, code, word_id)
    if word is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found",
        )

    if payload.normalized_word is not None:
        existing = words_crud.get_word_by_normalized(
            db,
            code,
            payload.normalized_word,
        )
        if existing is not None and existing.id != word_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Another word with this normalized form already exists",
            )

    word = words_crud.update_word(db, code, word, payload)
    return _with_language(word, code)


@router.delete(
    "/{language}/{word_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin_password)],
)
def delete_word(
    language: str,
    word_id: int,
    db: Session = Depends(get_db),
) -> None:
    """Delete a word (admin only)."""
    code = _validate_language(language)
    word = words_crud.get_word(db, code, word_id)
    if word is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found",
        )
    words_crud.delete_word(db, code, word)


def _with_language(word, language: str) -> WordResponse:
    """Attach the language code to a word response."""
    data = {
        column.name: getattr(word, column.name)
        for column in word.__table__.columns
    }
    data["language"] = language
    return WordResponse.model_validate(data)
