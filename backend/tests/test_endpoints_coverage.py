"""Endpoint coverage tests for routes not exercised elsewhere."""

from app.core import auth as auth_core


def _as_admin(monkeypatch):
    monkeypatch.setattr(auth_core.settings, "admin_password", "secret-admin")
    return {"X-Admin-Password": "secret-admin"}


def test_health_returns_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_users_search_requires_authentication(client):
    response = client.get("/users/search?q=pla")

    assert response.status_code == 401


def test_users_search_returns_matches_excluding_current_user(client, auth_headers):
    client.post(
        "/auth/register",
        json={
            "username": "player-two",
            "email": "player-two@example.com",
            "password": "supersecret1",
        },
    )
    client.post(
        "/auth/register",
        json={
            "username": "other",
            "email": "other@example.com",
            "password": "supersecret1",
        },
    )

    response = client.get("/users/search?q=play", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert [entry["username"] for entry in body] == ["player-two"]
    assert body[0]["email"] == "player-two@example.com"

    response_by_email = client.get(
        "/users/search?q=player-two@example.com",
        headers=auth_headers,
    )

    assert response_by_email.status_code == 200
    body_by_email = response_by_email.json()
    assert [entry["username"] for entry in body_by_email] == ["player-two"]
    assert body_by_email[0]["email"] == "player-two@example.com"


def test_friend_preference_patch_and_delete_flow(client, auth_headers):
    friend = client.post(
        "/auth/register",
        json={
            "username": "friend-patch",
            "email": "friend-patch@example.com",
            "password": "supersecret1",
        },
    ).json()

    created = client.post(
        "/users/me/friends",
        json={"friend_id": friend["id"], "share_times": False},
        headers=auth_headers,
    )
    assert created.status_code == 201

    updated = client.patch(
        f"/users/me/friends/{friend['id']}",
        json={"share_times": True},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["share_times"] is True

    deleted = client.delete(
        f"/users/me/friends/{friend['id']}",
        headers=auth_headers,
    )
    assert deleted.status_code == 204

    profile = client.get("/users/me/profile", headers=auth_headers).json()
    assert profile["friends"] == []


def test_friend_preference_delete_returns_404_when_missing(client, auth_headers):
    response = client.delete("/users/me/friends/99999", headers=auth_headers)

    assert response.status_code == 404


def test_rankings_daily_top_requires_authentication(client):
    response = client.get("/rankings/daily-top")

    assert response.status_code == 401


def test_rankings_daily_top_groups_and_orders_entries(client, auth_headers):
    client.post(
        "/scores",
        json={"completion_time": 30, "game_type": "mock-a"},
        headers=auth_headers,
    )
    client.post(
        "/scores",
        json={"completion_time": 12, "game_type": "mock-b"},
        headers=auth_headers,
    )

    client.post(
        "/auth/register",
        json={
            "username": "daily-top-2",
            "email": "daily-top-2@example.com",
            "password": "supersecret1",
        },
    )
    client.post(
        "/auth/login",
        data={"username": "daily-top-2", "password": "supersecret1"},
    )
    client.post(
        "/scores",
        json={"completion_time": 20, "game_type": "mock-a"},
    )

    response = client.get("/rankings/daily-top?limit=2")

    assert response.status_code == 200
    body = response.json()
    by_game = {entry["game_type"]: entry["entries"] for entry in body}
    assert [entry["completion_time"] for entry in by_game["mock-a"]] == [20, 30]
    assert [entry["rank"] for entry in by_game["mock-a"]] == [1, 2]
    assert [entry["completion_time"] for entry in by_game["mock-b"]] == [12]


def test_dictionary_endpoints_require_service_configuration(client, monkeypatch):
    from fastapi import HTTPException, status
    from app.routers import dictionary

    def _unavailable():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Dictionary service not configured",
        )

    monkeypatch.setattr(dictionary, "_require_service", _unavailable)

    response = client.get("/dictionary")

    assert response.status_code == 503


def test_dictionary_list_words_proxies_response(client, monkeypatch):
    from app.routers import dictionary

    monkeypatch.setattr(dictionary, "_require_service", lambda: None)
    monkeypatch.setattr(
        dictionary.proxy,
        "proxy_list",
        lambda language, params: {
            "total": 1,
            "skip": params.get("skip", 0),
            "limit": params.get("limit", 100),
            "items": [{"id": 10, "word": "gato", "language": language}],
        },
    )

    response = client.get("/dictionary?language=es&skip=0&limit=10")

    assert response.status_code == 200
    assert response.json()["items"][0]["word"] == "gato"


def test_dictionary_count_get_create_import_update_delete(client, monkeypatch):
    from app.routers import dictionary

    admin_headers = _as_admin(monkeypatch)
    monkeypatch.setattr(dictionary, "_require_service", lambda: None)
    monkeypatch.setattr(dictionary.proxy, "proxy_count", lambda language: {"count": 7})
    monkeypatch.setattr(
        dictionary.proxy,
        "proxy_get",
        lambda word_id, language: {"id": word_id, "word": "sol", "language": language},
    )
    monkeypatch.setattr(
        dictionary.proxy,
        "proxy_create",
        lambda language, payload: {"id": 1, "language": language, **payload},
    )
    monkeypatch.setattr(
        dictionary.proxy,
        "proxy_import",
        lambda language, payload: {
            "inserted": len(payload),
            "total_received": len(payload),
        },
    )
    monkeypatch.setattr(
        dictionary.proxy,
        "proxy_update",
        lambda word_id, language, payload: {
            "id": word_id,
            "language": language,
            **payload,
        },
    )
    deleted = {"called": False}

    def _proxy_delete(word_id, language):
        deleted["called"] = True

    monkeypatch.setattr(dictionary.proxy, "proxy_delete", _proxy_delete)

    count = client.get("/dictionary/count?language=es")
    assert count.status_code == 200
    assert count.json() == {"count": 7}

    got = client.get("/dictionary/99?language=es")
    assert got.status_code == 200
    assert got.json()["id"] == 99

    created = client.post(
        "/dictionary?language=es",
        json={"word": "luz"},
        headers=admin_headers,
    )
    assert created.status_code == 201
    assert created.json()["word"] == "luz"

    imported = client.post(
        "/dictionary/import?language=es",
        json=[{"word": "uno"}, {"word": "dos"}],
        headers=admin_headers,
    )
    assert imported.status_code == 201
    assert imported.json() == {"inserted": 2, "total_received": 2}

    updated = client.patch(
        "/dictionary/99?language=es",
        json={"word": "luna"},
        headers=admin_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["word"] == "luna"

    removed = client.delete("/dictionary/99?language=es", headers=admin_headers)
    assert removed.status_code == 204
    assert deleted["called"] is True


def test_dictionary_admin_endpoints_reject_wrong_password(client, monkeypatch):
    from app.routers import dictionary

    _as_admin(monkeypatch)
    monkeypatch.setattr(dictionary, "_require_service", lambda: None)

    response = client.post(
        "/dictionary?language=es",
        json={"word": "luz"},
        headers={"X-Admin-Password": "wrong"},
    )

    assert response.status_code == 403


def test_backup_list_create_and_restore(client, monkeypatch):
    from app.routers import backup

    admin_headers = _as_admin(monkeypatch)
    monkeypatch.setattr(
        backup,
        "list_backups",
        lambda: [
            {
                "path": "daily/daily_20260802_000001.sql.gz",
                "size_bytes": 68013,
                "modified_at": "2026-08-02T00:00:01+00:00",
            }
        ],
    )
    monkeypatch.setattr(
        backup,
        "create_backup",
        lambda: {"status": "ok", "message": "Backup created: fake.sql.gz"},
    )
    monkeypatch.setattr(
        backup,
        "restore_backup",
        lambda file: {"status": "ok", "message": f"Restored from {file}"},
    )

    listed = client.get("/db/backup/list", headers=admin_headers)
    assert listed.status_code == 200
    assert listed.json()["status"] == "ok"
    assert len(listed.json()["backups"]) == 1

    created = client.post("/db/backup", headers=admin_headers)
    assert created.status_code == 200
    assert created.json()["status"] == "ok"

    restored = client.post(
        "/db/backup/restore?file=daily/daily_20260802_000001.sql.gz",
        headers=admin_headers,
    )
    assert restored.status_code == 200
    assert restored.json()["status"] == "ok"


def test_backup_endpoints_reject_missing_or_wrong_admin_password(client, monkeypatch):
    _as_admin(monkeypatch)

    no_header = client.get("/db/backup/list")
    assert no_header.status_code == 403

    wrong = client.post(
        "/db/backup",
        headers={"X-Admin-Password": "wrong"},
    )
    assert wrong.status_code == 403
