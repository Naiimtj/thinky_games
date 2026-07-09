"""Tests for the score submission and ranking endpoints."""


def test_submit_score_requires_authentication(client):
    response = client.post("/scores", json={"completion_time": 42})

    assert response.status_code == 401


def test_submit_score_persists_time(client, auth_headers):
    # "mock-a" isn't a backend-generated game, so no solution validation runs;
    # this keeps the test focused on score persistence mechanics.
    response = client.post(
        "/scores",
        json={"completion_time": 42, "game_type": "mock-a"},
        headers=auth_headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["completion_time"] == 42
    assert body["game_type"] == "mock-a"


def test_submit_score_rejects_non_positive_time(client, auth_headers):
    response = client.post(
        "/scores",
        json={"completion_time": 0},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_submit_score_is_idempotent_per_day(client, auth_headers):
    # A user can only have one score per game per day: resubmitting (e.g. a
    # client retry) must return the original score instead of a new row.
    first = client.post(
        "/scores",
        json={"completion_time": 42, "game_type": "mock-a"},
        headers=auth_headers,
    ).json()

    second = client.post(
        "/scores",
        json={"completion_time": 95, "game_type": "mock-a"},
        headers=auth_headers,
    ).json()

    assert second["id"] == first["id"]
    assert second["completion_time"] == 42


def test_rankings_are_ordered_fastest_first(client, auth_headers):
    # Each user gets one score per day, so ranking ordering across multiple
    # entries is exercised with distinct users.
    times = (95, 42, 60)
    for index, completion_time in enumerate(times):
        username = f"player{index}"
        client.post(
            "/auth/register",
            json={
                "username": username,
                "email": f"{username}@example.com",
                "password": "supersecret1",
            },
        )
        token = client.post(
            "/auth/login",
            data={"username": username, "password": "supersecret1"},
        ).json()["access_token"]
        client.post(
            "/scores",
            json={"completion_time": completion_time, "game_type": "mock-a"},
            headers={"Authorization": f"Bearer {token}"},
        )

    board = client.get(
        "/rankings?period=global&game_type=mock-a", headers=auth_headers
    ).json()

    assert [entry["completion_time"] for entry in board] == [42, 60, 95]
    assert [entry["rank"] for entry in board] == [1, 2, 3]


def test_rankings_require_authentication(client):
    response = client.get("/rankings")

    assert response.status_code == 401


def test_rankings_empty_for_authenticated_user(client, auth_headers):
    response = client.get("/rankings", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == []


def test_daily_status_false_before_playing(client, auth_headers):
    response = client.get(
        "/scores/daily-status?game_type=zip", headers=auth_headers
    )

    assert response.status_code == 200
    assert response.json() == {"played_today": False}


def test_daily_status_true_after_playing(client, auth_headers):
    client.post(
        "/scores",
        json={"completion_time": 42, "game_type": "mock-a"},
        headers=auth_headers,
    )

    response = client.get(
        "/scores/daily-status?game_type=mock-a", headers=auth_headers
    )

    assert response.status_code == 200
    assert response.json() == {"played_today": True}


def test_daily_status_is_scoped_per_game_type(client, auth_headers):
    client.post(
        "/scores",
        json={"completion_time": 42, "game_type": "mock-a"},
        headers=auth_headers,
    )

    response = client.get(
        "/scores/daily-status?game_type=mock-b", headers=auth_headers
    )

    assert response.status_code == 200
    assert response.json() == {"played_today": False}


def test_daily_status_requires_authentication(client):
    response = client.get("/scores/daily-status")

    assert response.status_code == 401


def test_daily_played_games_empty_before_playing(client, auth_headers):
    response = client.get("/scores/daily-played", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == {"game_types": []}


def test_daily_played_games_lists_each_played_game_type(client, auth_headers):
    client.post(
        "/scores",
        json={"completion_time": 42, "game_type": "mock-a"},
        headers=auth_headers,
    )
    client.post(
        "/scores",
        json={"completion_time": 30, "game_type": "mock-b"},
        headers=auth_headers,
    )

    response = client.get("/scores/daily-played", headers=auth_headers)

    assert response.status_code == 200
    assert sorted(response.json()["game_types"]) == ["mock-a", "mock-b"]


def test_daily_played_games_requires_authentication(client):
    response = client.get("/scores/daily-played")

    assert response.status_code == 401

