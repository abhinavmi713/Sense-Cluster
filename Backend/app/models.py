import enum
import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, DateTime, Enum, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config import get_settings
from app.db import Base


class Role(str, enum.Enum):
    member = "member"
    contributor = "contributor"
    admin = "admin"


class QuestionStatus(str, enum.Enum):
    open = "open"
    answered = "answered"


class ContributorRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        index=True,
    )
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(
        Enum(Role, name="role"),
        default=Role.member,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    contributor_requests: Mapped[list["ContributorRequest"]] = relationship(
        back_populates="user",
        foreign_keys="ContributorRequest.user_id",
    )

    reviewed_contributor_requests: Mapped[list["ContributorRequest"]] = relationship(
        back_populates="reviewed_by",
        foreign_keys="ContributorRequest.reviewed_by_id",
    )


class Question(Base):
    __tablename__ = "questions"
    __table_args__ = (
        UniqueConstraint(
            "normalized_text",
            name="uq_questions_normalized_text",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    text: Mapped[str] = mapped_column(Text)
    normalized_text: Mapped[str] = mapped_column(Text)
    status: Mapped[QuestionStatus] = mapped_column(
        Enum(QuestionStatus, name="question_status"),
        default=QuestionStatus.open,
        nullable=False,
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
    )

    # SQLite is supported only for local development.
    # PostgreSQL uses pgvector in production.
    embedding: Mapped[list[float]] = mapped_column(
        JSON
        if get_settings().database_url.startswith("sqlite")
        else Vector(get_settings().embedding_dimensions)
    )

    embedding_model: Mapped[str] = mapped_column(String(160))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    version: Mapped[int] = mapped_column(
        default=1,
        nullable=False,
    )

    answer: Mapped["Answer | None"] = relationship(
        back_populates="question",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"),
        unique=True,
    )
    content: Mapped[str] = mapped_column(Text)
    author_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    question: Mapped[Question] = relationship(
        back_populates="answer",
    )


class ContributorRequest(Base):
    __tablename__ = "contributor_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    status: Mapped[ContributorRequestStatus] = mapped_column(
        Enum(
            ContributorRequestStatus,
            name="contributor_request_status",
        ),
        default=ContributorRequestStatus.pending,
        nullable=False,
        index=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    user: Mapped[User] = relationship(
        back_populates="contributor_requests",
        foreign_keys=[user_id],
    )

    reviewed_by: Mapped[User | None] = relationship(
        back_populates="reviewed_contributor_requests",
        foreign_keys=[reviewed_by_id],
    )