"""initial schema with pgvector

Revision ID: 001_initial
Revises:
Create Date: 2026-09-10
"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table("users", sa.Column("id", sa.UUID(), primary_key=True), sa.Column("email", sa.String(320), nullable=False, unique=True), sa.Column("password_hash", sa.String(255), nullable=False), sa.Column("role", sa.Enum("contributor", "admin", name="role"), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_table("questions", sa.Column("id", sa.UUID(), primary_key=True), sa.Column("text", sa.Text(), nullable=False), sa.Column("normalized_text", sa.Text(), nullable=False), sa.Column("status", sa.Enum("open", "answered", name="question_status"), nullable=False), sa.Column("author_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=False), sa.Column("embedding", Vector(768), nullable=False), sa.Column("embedding_model", sa.String(160), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.Column("version", sa.Integer(), nullable=False, server_default="1"), sa.UniqueConstraint("normalized_text", name="uq_questions_normalized_text"))
    op.create_index("ix_questions_author_id", "questions", ["author_id"])
    op.create_table("answers", sa.Column("id", sa.UUID(), primary_key=True), sa.Column("question_id", sa.UUID(), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, unique=True), sa.Column("content", sa.Text(), nullable=False), sa.Column("author_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False))
    op.create_index("ix_answers_author_id", "answers", ["author_id"])


def downgrade():
    op.drop_table("answers")
    op.drop_table("questions")
    op.drop_table("users")
    op.execute("DROP EXTENSION IF EXISTS vector")
