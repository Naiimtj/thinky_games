"""Store daily word puzzles independently by locale.

Revision ID: 003_localized_daily_puzzles
Revises: 002_daily_puzzles
Create Date: 2026-07-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_localized_daily_puzzles"
down_revision: Union[str, None] = "002_daily_puzzles"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add locale without changing existing Spanish puzzle data."""
    op.add_column(
        "daily_puzzles",
        sa.Column("locale", sa.String(2), nullable=False, server_default="es"),
    )
    op.create_index("ix_daily_puzzles_locale", "daily_puzzles", ["locale"])
    op.drop_constraint(
        "uq_daily_puzzle_game_date", "daily_puzzles", type_="unique"
    )
    op.create_unique_constraint(
        "uq_daily_puzzle_game_locale_date",
        "daily_puzzles",
        ["game_type", "locale", "puzzle_date"],
    )
    op.alter_column("daily_puzzles", "locale", server_default=None)


def downgrade() -> None:
    raise NotImplementedError(
        "Downgrading would discard non-Spanish daily puzzles; restore from backup instead."
    )