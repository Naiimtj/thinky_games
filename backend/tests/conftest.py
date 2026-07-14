"""Shared pytest fixtures.

Each test runs against a fresh in-memory SQLite database so tests never touch
the real MySQL database, and app startup never attempts real migrations.
"""

import os

# Point the app at throwaway settings *before* it is imported, so importing
# ``app.main`` never tries to reach a real MySQL instance.
os.environ.setdefault("MYSQL_USER", "test")
os.environ.setdefault("MYSQL_PASSWORD", "test")
os.environ.setdefault("RUN_MIGRATIONS_ON_STARTUP", "false")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database.database import Base
from app.dependencies import get_db
from app.main import app


@pytest.fixture()
def db_session() -> Session:
    """Provide an isolated in-memory database session for a single test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    testing_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = testing_session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    """API client whose requests use the isolated test database session."""

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client: TestClient) -> dict[str, str]:
    """Register and log in a user, returning the legacy empty headers shape."""
    client.post(
        "/auth/register",
        json={
            "username": "player",
            "email": "player@example.com",
            "password": "supersecret1",
        },
    )
    client.post(
        "/auth/login",
        data={"username": "player", "password": "supersecret1"},
    )
    return {}
