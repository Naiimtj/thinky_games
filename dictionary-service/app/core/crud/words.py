"""CRUD operations for language-specific word tables."""

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database.models import LANGUAGE_MODELS, Base
from app.core.schemas.words import WordCreate, WordUpdate


def _model_for_language(language: str) -> type[Base]:
    """Return the ORM model class for a language code."""
    code = language.lower()
    model = LANGUAGE_MODELS.get(code)
    if model is None:
        raise ValueError(f"Unsupported language: {language}")
    return model


def get_word(db: Session, language: str, word_id: int) -> Base | None:
    """Return a single word by language and primary key."""
    model = _model_for_language(language)
    return db.query(model).filter(model.id == word_id).first()


def get_word_by_normalized(
    db: Session,
    language: str,
    normalized_word: str,
) -> Base | None:
    """Return a word by its normalized form for the given language."""
    model = _model_for_language(language)
    return (
        db.query(model)
        .filter(model.normalized_word == normalized_word.lower().strip())
        .first()
    )


def list_words(
    db: Session,
    language: str,
    *,
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
) -> tuple[list[Base], int]:
    """Return a filtered page of words plus the total count."""
    model = _model_for_language(language)
    query = db.query(model)

    if category:
        query = query.filter(model.category == category.lower())
    if difficulty:
        query = query.filter(model.difficulty == difficulty.lower())
    if min_length is not None:
        query = query.filter(model.length >= min_length)
    if max_length is not None:
        query = query.filter(model.length <= max_length)
    if suitable_for_crossword is not None:
        query = query.filter(model.suitable_for_crossword == suitable_for_crossword)
    if suitable_for_word_search is not None:
        query = query.filter(model.suitable_for_word_search == suitable_for_word_search)
    if suitable_for_children is not None:
        query = query.filter(model.suitable_for_children == suitable_for_children)
    if is_common is not None:
        query = query.filter(model.is_common == is_common)
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (func.lower(model.word).like(search_term))
            | (func.lower(model.normalized_word).like(search_term))
            | (func.lower(model.definition).like(search_term))
            | (func.lower(model.clue).like(search_term))
        )

    total = query.count()
    words = query.order_by(model.id).offset(skip).limit(limit).all()
    return words, total


def create_word(db: Session, language: str, payload: WordCreate) -> Base:
    """Persist a new word after normalizing fields."""
    model = _model_for_language(language)
    data = payload.model_dump()
    data["normalized_word"] = data["normalized_word"].lower().strip()
    data["category"] = data["category"].lower()
    data["difficulty"] = data["difficulty"].lower()

    word = model(**data)
    db.add(word)
    db.commit()
    db.refresh(word)
    return word


def update_word(
    db: Session,
    language: str,
    word: Base,
    payload: WordUpdate,
) -> Base:
    """Apply partial updates to an existing word."""
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field in {"normalized_word", "category", "difficulty"} and value is not None:
            value = value.lower()
        setattr(word, field, value)

    if "normalized_word" in updates:
        word.length = len(word.normalized_word)

    db.commit()
    db.refresh(word)
    return word


def delete_word(db: Session, language: str, word: Base) -> None:
    """Remove a word from the database."""
    db.delete(word)
    db.commit()


def count_words(db: Session, language: str | None = None) -> int | dict[str, int]:
    """Return the total number of words stored.

    If language is provided, returns an int. Otherwise returns a dict with
    counts per supported language.
    """
    if language:
        model = _model_for_language(language)
        return db.query(model).count()

    return {
        code: db.query(model).count()
        for code, model in LANGUAGE_MODELS.items()
    }


def bulk_create_words(
    db: Session,
    language: str,
    payloads: list[WordCreate],
) -> int:
    """Insert many words, skipping entries that already exist.

    Returns the number of newly inserted words.
    """
    inserted = 0
    for payload in payloads:
        existing = get_word_by_normalized(
            db,
            language,
            payload.normalized_word,
        )
        if existing is not None:
            continue
        data = payload.model_dump()
        data["normalized_word"] = data["normalized_word"].lower().strip()
        data["category"] = data["category"].lower()
        data["difficulty"] = data["difficulty"].lower()

        model = _model_for_language(language)
        db.add(model(**data))
        inserted += 1

    db.commit()
    return inserted
