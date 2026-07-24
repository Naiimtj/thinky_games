"""SQLAlchemy ORM models: one table per supported language."""

from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    Text,
    UniqueConstraint,
)

from app.core.database.database import Base


class _WordBase:
    """Shared columns for all language word tables."""

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String(50), nullable=False, index=True)
    display_word = Column(String(50), nullable=False)
    normalized_word = Column(String(50), nullable=False, index=True)
    definition = Column(Text, nullable=False)
    clue = Column(String(255), nullable=False)
    category = Column(String(30), nullable=False, index=True)
    difficulty = Column(String(10), nullable=False, index=True)
    length = Column(Integer, nullable=False, index=True)
    is_common = Column(Boolean, default=True, nullable=False)
    suitable_for_children = Column(Boolean, default=True, nullable=False)
    suitable_for_crossword = Column(Boolean, default=True, nullable=False)
    suitable_for_word_search = Column(Boolean, default=True, nullable=False)
    contains_accent = Column(Boolean, default=False, nullable=False)
    tags = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class SpanishWord(Base, _WordBase):
    """Curated Spanish words."""

    __tablename__ = "spanish_words"

    __table_args__ = (
        UniqueConstraint(
            "normalized_word",
            name="uq_spanish_word_normalized",
        ),
    )


class EnglishWord(Base, _WordBase):
    """Curated English words."""

    __tablename__ = "english_words"

    __table_args__ = (
        UniqueConstraint(
            "normalized_word",
            name="uq_english_word_normalized",
        ),
    )


class GermanWord(Base, _WordBase):
    """Curated German words."""

    __tablename__ = "german_words"

    __table_args__ = (
        UniqueConstraint(
            "normalized_word",
            name="uq_german_word_normalized",
        ),
    )


LANGUAGE_MODELS = {
    "es": SpanishWord,
    "en": EnglishWord,
    "de": GermanWord,
}
