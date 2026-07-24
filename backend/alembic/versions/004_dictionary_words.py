"""Add curated dictionary table for word games.

Revision ID: 004_dictionary_words
Revises: 003_localized_daily_puzzles
Create Date: 2026-07-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_dictionary_words"
down_revision: Union[str, None] = "003_localized_daily_puzzles"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the dictionary_words table and indexes."""
    op.create_table(
        "dictionary_words",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("word", sa.String(50), nullable=False, index=True),
        sa.Column("display_word", sa.String(50), nullable=False),
        sa.Column("normalized_word", sa.String(50), nullable=False, index=True),
        sa.Column("definition", sa.Text(), nullable=False),
        sa.Column("clue", sa.String(255), nullable=False),
        sa.Column("category", sa.String(30), nullable=False, index=True),
        sa.Column("difficulty", sa.String(10), nullable=False, index=True),
        sa.Column("length", sa.Integer(), nullable=False, index=True),
        sa.Column("language", sa.String(2), nullable=False, index=True),
        sa.Column("is_common", sa.Boolean(), default=True, nullable=False),
        sa.Column(
            "suitable_for_children", sa.Boolean(), default=True, nullable=False
        ),
        sa.Column(
            "suitable_for_crossword", sa.Boolean(), default=True, nullable=False
        ),
        sa.Column(
            "suitable_for_word_search", sa.Boolean(), default=True, nullable=False
        ),
        sa.Column("contains_accent", sa.Boolean(), default=False, nullable=False),
        sa.Column("tags", sa.JSON(), default=list, nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint(
            "normalized_word",
            "language",
            name="uq_dictionary_word_normalized_language",
        ),
    )


def downgrade() -> None:
    op.drop_table("dictionary_words")
