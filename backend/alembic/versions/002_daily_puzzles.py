"""Daily puzzles buffer

Revision ID: 002_daily_puzzles
Revises: 001_initial_schema
Create Date: 2026-07-05
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_daily_puzzles"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "daily_puzzles",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("game_type", sa.String(30), nullable=False),
        sa.Column("puzzle_date", sa.Date, nullable=False),
        sa.Column("seed", sa.Integer, nullable=False),
        sa.Column("payload", sa.JSON, nullable=False),
        sa.Column("solution", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index(
        "ix_daily_puzzles_game_type", "daily_puzzles", ["game_type"]
    )
    op.create_index(
        "ix_daily_puzzles_puzzle_date", "daily_puzzles", ["puzzle_date"]
    )
    op.create_unique_constraint(
        "uq_daily_puzzle_game_date",
        "daily_puzzles",
        ["game_type", "puzzle_date"],
    )


def downgrade() -> None:
    op.drop_table("daily_puzzles")
