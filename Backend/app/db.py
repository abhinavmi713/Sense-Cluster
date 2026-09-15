from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()
engine_options = {"connect_args": {"check_same_thread": False}} if settings.database_url.startswith("sqlite") else {"pool_pre_ping": True, "pool_size": 5, "max_overflow": 5}
engine = create_engine(settings.database_url, **engine_options)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    with SessionLocal() as session:
        yield session
