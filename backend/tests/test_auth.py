"""Tests for the authentication endpoints."""


def _register_payload(**overrides) -> dict:
    payload = {
        "username": "ana",
        "email": "ana@example.com",
        "password": "supersecret1",
    }
    payload.update(overrides)
    return payload


def test_register_returns_public_user_without_secrets(client):
    response = client.post("/auth/register", json=_register_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "ana"
    assert body["email"] == "ana@example.com"
    assert "password" not in body
    assert "password_hash" not in body


def test_register_duplicate_username_conflicts(client):
    client.post("/auth/register", json=_register_payload())

    response = client.post(
        "/auth/register",
        json=_register_payload(email="other@example.com"),
    )

    assert response.status_code == 409


def test_register_rejects_short_password(client):
    response = client.post("/auth/register", json=_register_payload(password="short"))

    assert response.status_code == 422


def test_login_returns_bearer_token(client):
    client.post("/auth/register", json=_register_payload())

    response = client.post(
        "/auth/login",
        data={"username": "ana", "password": "supersecret1"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_with_wrong_password_is_unauthorized(client):
    client.post("/auth/register", json=_register_payload())

    response = client.post(
        "/auth/login",
        data={"username": "ana", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_me_returns_the_authenticated_user(client, auth_headers):
    response = client.get("/auth/me", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["username"] == "player"


def test_me_requires_authentication(client):
    assert client.get("/auth/me").status_code == 401
