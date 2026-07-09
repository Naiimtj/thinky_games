"""Initial schema - users and scores

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-07-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "scores",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("game_type", sa.String(30), nullable=False, server_default="zip"),
        sa.Column("completion_time", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index("ix_scores_user_id", "scores", ["user_id"])
    op.create_index("ix_scores_game_type", "scores", ["game_type"])
    op.create_index("ix_scores_completion_time", "scores", ["completion_time"])
    op.create_index("ix_scores_created_at", "scores", ["created_at"])


def downgrade() -> None:
    op.drop_table("scores")
    op.drop_table("users")
