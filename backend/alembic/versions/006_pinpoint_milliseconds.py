"""Store Pinpoint completion times in milliseconds.

Revision ID: 006_pinpoint_ms
Revises: 005_user_privacy
Create Date: 2026-10-31
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006_pinpoint_ms"
down_revision: Union[str, None] = "005_user_privacy"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
	"""Convert existing Pinpoint scores from seconds to milliseconds (runs once)."""
	op.execute(
		sa.text(
			"UPDATE scores SET completion_time = completion_time * 1000 "
			"WHERE game_type = 'pinpoint'"
		)
	)


def downgrade() -> None:
	"""Convert Pinpoint scores back to whole seconds."""
	op.execute(
		sa.text(
			"UPDATE scores SET completion_time = GREATEST(1, completion_time DIV 1000) "
			"WHERE game_type = 'pinpoint'"
		)
	)
