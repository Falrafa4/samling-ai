"""merge volume predictions and driver coverage area

Revision ID: df9180bdb858
Revises: 02313758cf80, ec85c8cdd98c
Create Date: 2026-07-14 06:20:33.805228

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'df9180bdb858'
down_revision: Union[str, Sequence[str], None] = ('02313758cf80', 'ec85c8cdd98c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
