"""add vector index on questions.embedding

Revision ID: 003_question_embedding_index
Revises: 002_member_contributor_requests
Create Date: 2026-09-14
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "003_question_embedding_index"
down_revision = "002_member_contributor_requests"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # create_question() orders candidates by cosine_distance(), so the index
    # must use the matching vector_cosine_ops operator class.
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_questions_embedding_cosine "
        "ON questions USING ivfflat (embedding vector_cosine_ops) "
        "WITH (lists = 100)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_questions_embedding_cosine")
