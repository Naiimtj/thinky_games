"""Tests for profile, privacy, and friend preference endpoints."""

from sqlalchemy.exc import SQLAlchemyError

from app.core.crud import users as user_crud
from app.core import uploads as upload_service


def test_profile_returns_user_and_friend_preferences(client, auth_headers):
    friend = client.post(
        "/auth/register",
        json={
            "username": "friend",
            "email": "friend@example.com",
            "password": "supersecret1",
        },
    ).json()

    client.post(
        "/users/me/friends",
        json={"friend_id": friend["id"], "share_times": False},
        headers=auth_headers,
    )

    response = client.get("/users/me/profile", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "player"
    assert body["share_results_globally"] is True
    assert len(body["friends"]) == 1
    assert body["friends"][0]["friend_username"] == "friend"
    assert body["friends"][0]["share_times"] is False


def test_update_me_changes_username_and_email(client, auth_headers):
    response = client.patch(
        "/users/me",
        json={"username": "player2", "email": "player2@example.com"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "player2"
    assert body["email"] == "player2@example.com"



def test_update_privacy_toggles_global_sharing(client, auth_headers):
    response = client.patch(
        "/users/me/privacy",
        json={"share_results_globally": False},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["share_results_globally"] is False



def test_delete_account_requires_authentication(client):
    response = client.delete("/users/me")

    assert response.status_code == 401



def test_delete_account_removes_session(client, auth_headers):
    response = client.delete("/users/me", headers=auth_headers)

    assert response.status_code == 204
    assert client.get("/auth/me").status_code == 401


def test_upload_avatar_stores_cloudinary_url(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        upload_service,
        "upload_image",
        lambda _content: "https://res.cloudinary.com/demo/image/upload/v1/thinkyGames/avatar.png",
    )

    response = client.post(
        "/users/me/avatar",
        headers=auth_headers,
        files={"file": ("avatar.png", b"fake-image-bytes", "image/png")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["avatar_url"].startswith("https://res.cloudinary.com/")


def test_upload_avatar_rejects_non_image(client, auth_headers):
    response = client.post(
        "/users/me/avatar",
        headers=auth_headers,
        files={"file": ("doc.txt", b"plain", "text/plain")},
    )

    assert response.status_code == 422


def test_upload_avatar_rejects_files_over_5mb(client, auth_headers):
    oversized_content = b"0" * ((5 * 1024 * 1024) + 1)
    response = client.post(
        "/users/me/avatar",
        headers=auth_headers,
        files={"file": ("big-avatar.png", oversized_content, "image/png")},
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "Avatar file exceeds the 5MB limit."


def test_upload_avatar_returns_clear_error_on_storage_failure(
    client,
    auth_headers,
    monkeypatch,
):
    def _fail_set_avatar_url(*args, **kwargs):
        raise SQLAlchemyError("simulated storage failure")

    monkeypatch.setattr(
        upload_service,
        "upload_image",
        lambda _content: "https://res.cloudinary.com/demo/image/upload/v1/thinkyGames/avatar.png",
    )
    monkeypatch.setattr(user_crud, "set_avatar_url", _fail_set_avatar_url)

    response = client.post(
        "/users/me/avatar",
        headers=auth_headers,
        files={"file": ("avatar.png", b"fake-image-bytes", "image/png")},
    )

    assert response.status_code == 500
    assert (
        response.json()["detail"]
        == "Avatar upload failed while storing the image in the database. Please contact the administrator."
    )


def test_upload_avatar_returns_clear_error_on_cloudinary_failure(
    client,
    auth_headers,
    monkeypatch,
):
    def _fail_upload_image(_content):
        raise RuntimeError("simulated Cloudinary failure")

    monkeypatch.setattr(upload_service, "upload_image", _fail_upload_image)

    response = client.post(
        "/users/me/avatar",
        headers=auth_headers,
        files={"file": ("avatar.png", b"fake-image-bytes", "image/png")},
    )

    assert response.status_code == 500
    assert (
        response.json()["detail"]
        == "Avatar upload failed while uploading to Cloudinary. Please contact the administrator."
    )
