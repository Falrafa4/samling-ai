"""add_lower_kecamatan_index_to_zones

Revision ID: 7ca0c949a3eb
Revises: a1d8b2be6ce8
Create Date: 2026-07-09 10:54:46.837290

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7ca0c949a3eb'
down_revision: Union[str, Sequence[str], None] = 'a1d8b2be6ce8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE INDEX ix_zones_lower_kecamatan ON zones (lower(kecamatan));")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS ix_zones_lower_kecamatan;")
