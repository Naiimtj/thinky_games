"""Tests for the score submission and ranking endpoints."""

from datetime import datetime, timedelta

from app.core.crud import scores as score_crud
from app.core.database.models import Score, User


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
        client.post(
            "/auth/login",
            data={"username": username, "password": "supersecret1"},
        )
        client.post(
            "/scores",
            json={"completion_time": completion_time, "game_type": "mock-a"},
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


def test_daily_summary_empty_before_playing(client, auth_headers):
    response = client.get("/scores/daily-summary", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == []


def test_daily_summary_reports_today_time_and_best_worst(client, auth_headers):
    client.post(
        "/scores",
        json={"completion_time": 42, "game_type": "mock-a"},
        headers=auth_headers,
    )

    response = client.get("/scores/daily-summary", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    entry = body[0]
    assert entry["game_type"] == "mock-a"
    assert entry["played_today"] is True
    assert entry["today_time"] == 42
    assert entry["best_time"] == 42
    assert entry["worst_time"] == 42
    assert entry["average_time"] == 42
    # No prior history to compare against, so there's no trend yet.
    assert entry["trend"] is None


def test_daily_summary_requires_authentication(client):
    response = client.get("/scores/daily-summary")

    assert response.status_code == 401


def test_daily_summary_trend_compares_today_against_prior_average(db_session):
    # Unit-tested directly against the crud layer since building trend history
    # requires backdating scores, which the idempotent-per-day API prevents.
    user = User(
        username="player",
        email="player@example.com",
        password_hash="hash",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    yesterday = datetime.utcnow() - timedelta(days=1)
    db_session.add_all(
        [
            Score(
                user_id=user.id,
                game_type="mock-a",
                completion_time=80,
                created_at=yesterday,
            ),
            Score(
                user_id=user.id,
                game_type="mock-a",
                completion_time=100,
                created_at=yesterday,
            ),
        ]
    )
    db_session.commit()

    db_session.add(
        Score(user_id=user.id, game_type="mock-a", completion_time=42)
    )
    db_session.commit()

    stats = score_crud.get_user_game_stats(db_session, user_id=user.id)

    assert len(stats) == 1
    entry = stats[0]
    assert entry.game_type == "mock-a"
    assert entry.today_time == 42
    assert entry.best_time == 42
    assert entry.worst_time == 100
    assert entry.trend == "better"


def test_my_ranks_empty_before_playing(client, auth_headers):
    response = client.get("/rankings/me", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == []


def test_my_ranks_reports_rank_after_playing(client, auth_headers):
    client.post(
        "/scores",
        json={"completion_time": 42, "game_type": "mock-a"},
        headers=auth_headers,
    )

    response = client.get("/rankings/me", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0] == {
        "game_type": "mock-a",
        "daily_rank": 1,
        "monthly_rank": 1,
        "global_rank": 1,
    }


def test_my_ranks_requires_authentication(client):
    response = client.get("/rankings/me")

    assert response.status_code == 401


def test_my_scores_empty_before_playing(client, auth_headers):
    response = client.get(
        "/scores/me?game_type=mock-a", headers=auth_headers
    )

    assert response.status_code == 200
    assert response.json() == []


def test_my_scores_lists_own_scores_fastest_first(db_session, client, auth_headers):
    client.post(
        "/scores",
        json={"completion_time": 42, "game_type": "mock-a"},
        headers=auth_headers,
    )
    # Backdate a second score directly via the DB since submission is
    # idempotent per day and would otherwise be rejected as a duplicate.
    user = db_session.query(User).filter(User.username == "player").one()
    db_session.add(
        Score(
            user_id=user.id,
            game_type="mock-a",
            completion_time=30,
            created_at=datetime.utcnow() - timedelta(days=1),
        )
    )
    db_session.commit()

    response = client.get(
        "/scores/me?game_type=mock-a", headers=auth_headers
    )

    assert response.status_code == 200
    body = response.json()
    assert [entry["completion_time"] for entry in body] == [30, 42]
    assert [entry["rank"] for entry in body] == [1, 2]


def test_my_scores_is_scoped_per_game_type(client, auth_headers):
    client.post(
        "/scores",
        json={"completion_time": 42, "game_type": "mock-a"},
        headers=auth_headers,
    )

    response = client.get(
        "/scores/me?game_type=mock-b", headers=auth_headers
    )

    assert response.status_code == 200
    assert response.json() == []


def test_my_scores_requires_authentication(client):
    response = client.get("/scores/me")

    assert response.status_code == 401

