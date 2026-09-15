from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: Literal["development", "test", "production"] = "development"
    database_url: str
    jwt_secret: SecretStr
    access_token_minutes: int = Field(default=30, ge=5, le=1440)
    cors_origins: list[str] = Field(default_factory=list)
    embedding_model: str = "sentence-transformers/all-mpnet-base-v2"
    embedding_dimensions: int = Field(default=768, gt=0)
    similarity_threshold: float = Field(default=0.82, ge=-1, le=1)
    bootstrap_admin_email: str | None = None
    bootstrap_admin_password: SecretStr | None = None

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors_origins(cls, value: str | list[str]) -> list[str]:
        return value.split(",") if isinstance(value, str) else value


@lru_cache
def get_settings() -> Settings:
    return Settings()
