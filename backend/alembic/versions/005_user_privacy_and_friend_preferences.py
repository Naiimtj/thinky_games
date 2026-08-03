"""Add user privacy, friend sharing preferences, and avatar storage.

Revision ID: 005_user_privacy
Revises: 004_dictionary_words
Create Date: 2026-08-03
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects import mysql

revision: str = "005_user_privacy"
down_revision: Union[str, None] = "004_dictionary_words"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	"""Add privacy column, friend preference table, and avatar URL column."""
	bind = op.get_bind()
	inspector = inspect(bind)

	existing_user_columns = {
		column["name"] for column in inspector.get_columns("users")
	}
	if "share_results_globally" not in existing_user_columns:
		op.add_column(
			"users",
			sa.Column(
				"share_results_globally",
				sa.Boolean(),
				nullable=False,
				server_default=sa.true(),
			),
		)

	if "avatar_url" not in existing_user_columns:
		avatar_type: sa.types.TypeEngine
		if bind.dialect.name == "mysql":
			avatar_type = mysql.MEDIUMTEXT()
		else:
			avatar_type = sa.Text()
		op.add_column("users", sa.Column("avatar_url", avatar_type, nullable=True))

	existing_tables = set(inspector.get_table_names())
	if "friend_preferences" not in existing_tables:
		op.create_table(
			"friend_preferences",
			sa.Column("id", sa.Integer(), primary_key=True),
			sa.Column("user_id", sa.Integer(), nullable=False, index=True),
			sa.Column("friend_id", sa.Integer(), nullable=False, index=True),
			sa.Column(
				"share_times",
				sa.Boolean(),
				nullable=False,
				server_default=sa.true(),
			),
			sa.Column(
				"created_at",
				sa.DateTime(),
				nullable=False,
				server_default=sa.func.now(),
			),
			sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
			sa.ForeignKeyConstraint(
				["friend_id"],
				["users.id"],
				ondelete="CASCADE",
			),
			sa.UniqueConstraint(
				"user_id",
				"friend_id",
				name="uq_friend_preference_user_friend",
			),
		)


def downgrade() -> None:
	"""Rollback privacy column, friend preference table, and avatar URL column."""
	bind = op.get_bind()
	inspector = inspect(bind)

	existing_tables = set(inspector.get_table_names())
	if "friend_preferences" in existing_tables:
		op.drop_table("friend_preferences")

	existing_user_columns = {
		column["name"] for column in inspector.get_columns("users")
	}
	if "avatar_url" in existing_user_columns:
		op.drop_column("users", "avatar_url")
	if "share_results_globally" in existing_user_columns:
		op.drop_column("users", "share_results_globally")
