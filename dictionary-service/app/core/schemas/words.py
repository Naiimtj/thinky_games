"""Pydantic schemas for dictionary words."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

DIFFICULTY_LEVELS = {"easy", "medium", "hard"}
CATEGORIES = {
    "animales",
    "naturaleza",
    "geografia",
    "comida",
    "objetos",
    "casa",
    "cuerpo",
    "emociones",
    "profesiones",
    "transporte",
    "ciencia",
    "arte",
    "musica",
    "deporte",
    "tiempo",
    "escuela",
    "tecnologia",
    "sociedad",
    "colores",
    "plantas",
}
LANGUAGES = {"es", "en", "de"}
LanguageCode = str


class WordBase(BaseModel):
    """Shared fields for word payloads."""

    word: str = Field(..., min_length=3, max_length=50)
    display_word: str = Field(..., min_length=3, max_length=50)
    normalized_word: str = Field(..., min_length=3, max_length=50)
    definition: str = Field(..., min_length=10, max_length=500)
    clue: str = Field(..., min_length=3, max_length=255)
    category: str
    difficulty: str
    length: int = Field(..., ge=3, le=12)
    is_common: bool = True
    suitable_for_children: bool = True
    suitable_for_crossword: bool = True
    suitable_for_word_search: bool = True
    contains_accent: bool = False
    tags: list[str] = Field(default_factory=list)

    @field_validator("difficulty")
    @classmethod
    def _validate_difficulty(cls, value: str) -> str:
        if value not in DIFFICULTY_LEVELS:
            raise ValueError(f"difficulty must be one of {sorted(DIFFICULTY_LEVELS)}")
        return value

    @field_validator("category")
    @classmethod
    def _validate_category(cls, value: str) -> str:
        value = value.lower()
        if value not in CATEGORIES:
            raise ValueError(f"category must be one of {sorted(CATEGORIES)}")
        return value

    @field_validator("normalized_word")
    @classmethod
    def _validate_normalized_word(cls, value: str) -> str:
        normalized = value.lower().strip()
        if " " in normalized:
            raise ValueError("normalized_word must be a single word without spaces")
        return normalized

    @field_validator("length")
    @classmethod
    def _validate_length_matches(cls, value: int, info) -> int:
        normalized = info.data.get("normalized_word", "")
        if normalized and len(normalized) != value:
            raise ValueError("length must match normalized_word length")
        return value


class WordCreate(WordBase):
    """Payload required to create a new word."""


class WordUpdate(BaseModel):
    """Payload for partial updates of a word."""

    word: str | None = Field(default=None, min_length=3, max_length=50)
    display_word: str | None = Field(default=None, min_length=3, max_length=50)
    normalized_word: str | None = Field(default=None, min_length=3, max_length=50)
    definition: str | None = Field(default=None, min_length=10, max_length=500)
    clue: str | None = Field(default=None, min_length=3, max_length=255)
    category: str | None = None
    difficulty: str | None = None
    length: int | None = Field(default=None, ge=3, le=12)
    is_common: bool | None = None
    suitable_for_children: bool | None = None
    suitable_for_crossword: bool | None = None
    suitable_for_word_search: bool | None = None
    contains_accent: bool | None = None
    tags: list[str] | None = None

    @field_validator("difficulty")
    @classmethod
    def _validate_difficulty(cls, value: str | None) -> str | None:
        if value is not None and value not in DIFFICULTY_LEVELS:
            raise ValueError(f"difficulty must be one of {sorted(DIFFICULTY_LEVELS)}")
        return value

    @field_validator("category")
    @classmethod
    def _validate_category(cls, value: str | None) -> str | None:
        if value is not None:
            value = value.lower()
            if value not in CATEGORIES:
                raise ValueError(f"category must be one of {sorted(CATEGORIES)}")
        return value

    @field_validator("normalized_word")
    @classmethod
    def _validate_normalized_word(cls, value: str | None) -> str | None:
        if value is not None:
            normalized = value.lower().strip()
            if " " in normalized:
                raise ValueError("normalized_word must be a single word without spaces")
            return normalized
        return value


class WordResponse(WordBase):
    """Word as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    language: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class WordListResponse(BaseModel):
    """Paginated list of words."""

    total: int
    skip: int
    limit: int
    language: str
    items: list[WordResponse]


class BulkImportResponse(BaseModel):
    """Result of a bulk word import."""

    inserted: int
    total_received: int
    language: str
