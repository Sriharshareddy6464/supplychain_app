"""standardize_user_roles

Revision ID: 3b59ecaa2de9
Revises: 61bdcbf3028d
Create Date: 2026-03-09 21:08:46.576515

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3b59ecaa2de9'
down_revision: Union[str, Sequence[str], None] = '61bdcbf3028d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    
    try:
        with conn.begin_nested():
            conn.execute(sa.text("ALTER TYPE userrole ADD VALUE 'ADMIN'"))
    except sa.exc.ProgrammingError:
        pass

    try:
        with conn.begin_nested():
            conn.execute(sa.text("ALTER TYPE userrole ADD VALUE 'DRIVER'"))
    except sa.exc.ProgrammingError:
        pass
            
    try:
        with conn.begin_nested():
            conn.execute(sa.text("ALTER TYPE userrole RENAME VALUE 'TRANSPORTER' TO 'DRIVER'"))
    except sa.exc.ProgrammingError:
        pass


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    try:
        with conn.begin_nested():
            conn.execute(sa.text("ALTER TYPE userrole RENAME VALUE 'DRIVER' TO 'TRANSPORTER'"))
    except sa.exc.ProgrammingError:
        pass
