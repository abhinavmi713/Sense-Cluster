"""add member role and contributor requests

Revision ID: 002_member_contributor_requests
Revises: 001_initial
Create Date: 2026-09-12
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "002_member_contributor_requests"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # PostgreSQL enum update.
    # Existing users remain contributors/admins.
    # New registrations will use member.
    op.execute(
        "ALTER TYPE role ADD VALUE IF NOT EXISTS 'member'"
    )

    contributor_request_status = sa.Enum(
        "pending",
        "approved",
        "rejected",
        name="contributor_request_status",
    )

    contributor_request_status.create(
        op.get_bind(),
        checkfirst=True,
    )

    op.create_table(
        "contributor_requests",
        sa.Column(
            "id",
            sa.UUID(),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.UUID(),
            nullable=False,
        ),
        sa.Column(
            "status",
            contributor_request_status,
            nullable=False,
        ),
        sa.Column(
            "reason",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "reviewed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "reviewed_by_id",
            sa.UUID(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_contributor_requests_user_id",
        "contributor_requests",
        ["user_id"],
    )

    op.create_index(
        "ix_contributor_requests_status",
        "contributor_requests",
        ["status"],
    )

    op.create_index(
        "ix_contributor_requests_reviewed_by_id",
        "contributor_requests",
        ["reviewed_by_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_contributor_requests_reviewed_by_id",
        table_name="contributor_requests",
    )

    op.drop_index(
        "ix_contributor_requests_status",
        table_name="contributor_requests",
    )

    op.drop_index(
        "ix_contributor_requests_user_id",
        table_name="contributor_requests",
    )

    op.drop_table("contributor_requests")

    op.execute(
        "DROP TYPE IF EXISTS contributor_request_status"
    )

    # PostgreSQL does not support removing an enum value directly.
    # The 'member' value should therefore remain in the role enum.