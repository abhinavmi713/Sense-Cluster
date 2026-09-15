import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RoleUpdate(BaseModel):
    role: Literal["member", "contributor", "admin"]


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    role: str
    created_at: datetime


class QuestionCreate(BaseModel):
    text: str = Field(min_length=5, max_length=1000)

    @field_validator("text")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        normalized = " ".join(value.split())

        if not normalized:
            raise ValueError("Question cannot be blank")

        return normalized


class AnswerCreate(BaseModel):
    content: str = Field(min_length=10, max_length=5000)

    @field_validator("content")
    @classmethod
    def normalize_content(cls, value: str) -> str:
        normalized = value.strip()

        if not normalized:
            raise ValueError("Answer cannot be blank")

        return normalized


class AnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    content: str
    author_id: uuid.UUID
    updated_at: datetime


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    text: str
    status: str
    author_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    answer: AnswerResponse | None = None


class SimilarQuestion(BaseModel):
    question: QuestionResponse
    similarity: float = Field(ge=-1, le=1)


class QuestionCreateResult(BaseModel):
    outcome: str
    question: QuestionResponse | None = None
    match: SimilarQuestion | None = None


class Page(BaseModel):
    items: list[QuestionResponse]
    total: int
    offset: int
    limit: int


class ContributorRequestCreate(BaseModel):
    reason: str | None = Field(
        default=None,
        max_length=2000,
    )

    @field_validator("reason")
    @classmethod
    def normalize_reason(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()

        return normalized or None


class ContributorRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    reason: str | None
    created_at: datetime
    reviewed_at: datetime | None
    reviewed_by_id: uuid.UUID | None


class ContributorRequestReview(BaseModel):
    status: Literal["approved", "rejected"]


class ContributorRequestWithUserResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_email: EmailStr
    status: str
    reason: str | None
    created_at: datetime
    reviewed_at: datetime | None
    reviewed_by_id: uuid.UUID | None