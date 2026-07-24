"""CRUD operations for the curated dictionary used by word games."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database.models import DictionaryWord
from app.core.schemas.dictionary import DictionaryWordCreate, DictionaryWordUpdate


def get_word(db: Session, word_id: int) -> DictionaryWord | None:
    """Return a single dictionary word by primary key."""
    return db.query(DictionaryWord).filter(DictionaryWord.id == word_id).first()


def get_word_by_normalized(
    db: Session,
    normalized_word: str,
    language: str,
) -> DictionaryWord | None:
    """Return a word by its normalized form and language, if it exists."""
    return (
        db.query(DictionaryWord)
        .filter(
            DictionaryWord.normalized_word == normalized_word.lower().strip(),
            DictionaryWord.language == language.lower(),
        )
        .first()
    )


def list_words(
    db: Session,
    *,
    language: str | None = None,
    category: str | None = None,
    difficulty: str | None = None,
    min_length: int | None = None,
    max_length: int | None = None,
    suitable_for_crossword: bool | None = None,
    suitable_for_word_search: bool | None = None,
    suitable_for_children: bool | None = None,
    is_common: bool | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[DictionaryWord], int]:
    """Return a filtered page of dictionary words plus the total count."""
    query = db.query(DictionaryWord)

    if language:
        query = query.filter(DictionaryWord.language == language.lower())
    if category:
        query = query.filter(DictionaryWord.category == category.lower())
    if difficulty:
        query = query.filter(DictionaryWord.difficulty == difficulty.lower())
    if min_length is not None:
        query = query.filter(DictionaryWord.length >= min_length)
    if max_length is not None:
        query = query.filter(DictionaryWord.length <= max_length)
    if suitable_for_crossword is not None:
        query = query.filter(
            DictionaryWord.suitable_for_crossword == suitable_for_crossword
        )
    if suitable_for_word_search is not None:
        query = query.filter(
            DictionaryWord.suitable_for_word_search == suitable_for_word_search
        )
    if suitable_for_children is not None:
        query = query.filter(
            DictionaryWord.suitable_for_children == suitable_for_children
        )
    if is_common is not None:
        query = query.filter(DictionaryWord.is_common == is_common)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(DictionaryWord.word).like(search_term))
            | (func.lower(DictionaryWord.normalized_word).like(search_term))
            | (func.lower(DictionaryWord.definition).like(search_term))
            | (func.lower(DictionaryWord.clue).like(search_term))
        )

    total = query.count()
    words = query.order_by(DictionaryWord.id).offset(skip).limit(limit).all()
    return words, total


def create_word(db: Session, payload: DictionaryWordCreate) -> DictionaryWord:
    """Persist a new dictionary word after normalizing language and normalized_word."""
    data = payload.model_dump()
    data["language"] = data["language"].lower()
    data["normalized_word"] = data["normalized_word"].lower().strip()
    data["category"] = data["category"].lower()
    data["difficulty"] = data["difficulty"].lower()

    word = DictionaryWord(**data)
    db.add(word)
    db.commit()
    db.refresh(word)
    return word


def update_word(
    db: Session,
    word: DictionaryWord,
    payload: DictionaryWordUpdate,
) -> DictionaryWord:
    """Apply partial updates to an existing dictionary word."""
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field in {"language", "normalized_word", "category", "difficulty"}:
            value = value.lower()
        setattr(word, field, value)

    # Re-derive length when the normalized form changed.
    if "normalized_word" in updates:
        word.length = len(word.normalized_word)

    db.commit()
    db.refresh(word)
    return word


def delete_word(db: Session, word: DictionaryWord) -> None:
    """Remove a dictionary word from the database."""
    db.delete(word)
    db.commit()


def count_words(db: Session) -> int:
    """Return the total number of dictionary words stored."""
    return db.query(DictionaryWord).count()


def bulk_create_words(db: Session, payloads: list[DictionaryWordCreate]) -> int:
    """Insert many dictionary words, skipping entries that already exist.

    Returns the number of newly inserted words.
    """
    inserted = 0
    for payload in payloads:
        existing = get_word_by_normalized(
            db,
            payload.normalized_word,
            payload.language,
        )
        if existing is not None:
            continue
        data = payload.model_dump()
        data["language"] = data["language"].lower()
        data["normalized_word"] = data["normalized_word"].lower().strip()
        data["category"] = data["category"].lower()
        data["difficulty"] = data["difficulty"].lower()
        db.add(DictionaryWord(**data))
        inserted += 1

    db.commit()
    return inserted
