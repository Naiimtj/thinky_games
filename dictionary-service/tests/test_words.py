"""Basic tests for the dictionary service words router."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database.database import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_dictionary.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_word_requires_admin():
    payload = {
        "word": "casa",
        "display_word": "casa",
        "normalized_word": "casa",
        "definition": "Lugar donde vive una persona o familia.",
        "clue": "Lugar donde vives.",
        "category": "casa",
        "difficulty": "easy",
        "length": 4,
    }
    response = client.post("/words/es", json=payload)
    assert response.status_code == 401


def test_create_and_get_word():
    payload = {
        "word": "casa",
        "display_word": "casa",
        "normalized_word": "casa",
        "definition": "Lugar donde vive una persona o familia.",
        "clue": "Lugar donde vives.",
        "category": "casa",
        "difficulty": "easy",
        "length": 4,
    }
    create = client.post("/words/es", json=payload, headers={"X-Admin-Password": "thinky"})
    assert create.status_code == 201
    word_id = create.json()["id"]

    get = client.get(f"/words/es/{word_id}")
    assert get.status_code == 200
    assert get.json()["word"] == "casa"


def test_import_words():
    payload = [
        {
            "word": "perro",
            "display_word": "perro",
            "normalized_word": "perro",
            "definition": "Animal doméstico que ladra.",
            "clue": "Animal doméstico que ladra.",
            "category": "animales",
            "difficulty": "easy",
            "length": 5,
        }
    ]
    response = client.post(
        "/words/es/import",
        json=payload,
        headers={"X-Admin-Password": "thinky"},
    )
    assert response.status_code == 201
    assert response.json()["inserted"] == 1
