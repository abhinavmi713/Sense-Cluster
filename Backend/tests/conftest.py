import os
import tempfile

_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.close(_db_fd)

os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"
os.environ["JWT_SECRET"] = "test-only-secret-key-not-for-production-use"
os.environ["ACCESS_TOKEN_MINUTES"] = "30"
os.environ["CORS_ORIGINS"] = '["http://localhost:5173"]'
os.environ["EMBEDDING_MODEL"] = "sentence-transformers/all-mpnet-base-v2"
os.environ["EMBEDDING_DIMENSIONS"] = "768"
os.environ["SIMILARITY_THRESHOLD"] = "0.82"
os.environ.pop("BOOTSTRAP_ADMIN_EMAIL", None)
os.environ.pop("BOOTSTRAP_ADMIN_PASSWORD", None)

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db import SessionLocal
from app.main import app
from app.models import Role, User
from app.rate_limit import auth_rate_limiter
from app.security import create_access_token, hash_password


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def _clean_database():
    """The create_question() SQLite fallback path scans every existing
    question row, so leftover data from earlier tests would make duplicate
    detection nondeterministic. Start every test from an empty database."""

    with SessionLocal() as db:
        db.execute(text("DELETE FROM answers"))
        db.execute(text("DELETE FROM contributor_requests"))
        db.execute(text("DELETE FROM questions"))
        db.execute(text("DELETE FROM users"))
        db.commit()

    auth_rate_limiter._hits.clear()

    yield


def unique_email() -> str:
    return f"user-{uuid.uuid4().hex}@example.com"


@pytest.fixture
def register_user(client):
    """Registers a fresh member account and returns (email, password, token)."""

    def _register(password: str = "a-strong-password-123"):
        email = unique_email()
        response = client.post(
            "/api/v1/auth/register",
            json={"email": email, "password": password},
        )
        assert response.status_code == 201
        return email, password, response.json()["access_token"]

    return _register


@pytest.fixture
def make_user_with_role():
    """Creates a user with an arbitrary role directly in the DB and returns a bearer token."""

    def _make(role: Role):
        email = unique_email()

        with SessionLocal() as db:
            user = User(
                email=email,
                password_hash=hash_password("a-strong-password-123"),
                role=role,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            token = create_access_token(user)
            return user.id, email, token

    return _make
