"""Tests for backend puzzle generation, delivery and solution validation."""

from datetime import timedelta

import pytest

from app.core.crud import puzzles as puzzle_crud
from app.core.games import crossclimb, patches, pinpoint, queens, sudoku, tango, wend
from app.core.games import zip as zip_puzzle
from app.core.games.daily import utc_today
from app.core.games.registry import PLAYABLE_GAMES, get_game

BACKEND_GAMES = [
    "queens",
    "zip",
    "tango",
    "sudoku",
    "pinpoint",
    "crossclimb",
    "wend",
    "patches",
]


def _daily_solution(client, game_type):
    """Fetch today's puzzle and compute a valid solution via the backend solver."""
    payload = client.get(f"/games/{game_type}/daily").json()["payload"]
    return get_game(game_type).solve(payload)


# --- Catalogue + delivery ---------------------------------------------------


def test_list_games_returns_playable_catalogue(client):
    body = client.get("/games").json()

    ids = {game["id"] for game in body}
    assert {"queens", "zip"} <= ids
    assert all(game["playable"] for game in body)


@pytest.mark.parametrize("game_type", BACKEND_GAMES)
def test_daily_puzzle_never_exposes_reference_solution(client, game_type):
    response = client.get(f"/games/{game_type}/daily")

    assert response.status_code == 200
    body = response.json()
    # The response schema never carries the server-side reference solution.
    assert "solution" not in body
    assert body["mode"] == "daily"


def test_daily_puzzle_unknown_game_returns_404(client):
    assert client.get("/games/nope/daily").status_code == 404


@pytest.mark.parametrize("game_type", BACKEND_GAMES)
def test_demo_puzzle_is_stable(client, game_type):
    first = client.get(f"/games/{game_type}/daily?mode=demo").json()
    second = client.get(f"/games/{game_type}/daily?mode=demo").json()

    assert first["payload"] == second["payload"]
    assert first["mode"] == "demo"


# --- Generation properties --------------------------------------------------


def test_queens_generation_is_deterministic():
    assert queens.generate(2026123).payload == queens.generate(2026123).payload


def test_zip_generation_is_deterministic():
    assert zip_puzzle.generate(2026123).payload == zip_puzzle.generate(2026123).payload


@pytest.mark.parametrize("seed", [1, 2, 3])
def test_generated_zip_has_unique_solution(seed):
    puzzle = zip_puzzle.generate(seed)
    assert zip_puzzle.count_solutions(puzzle.payload) == 1


@pytest.mark.parametrize("seed", [1, 2, 3])
def test_generated_queens_solution_is_valid(seed):
    puzzle = queens.generate(seed)
    assert queens.validate(puzzle.payload, puzzle.solution) is True


def test_sudoku_generation_is_deterministic():
    assert sudoku.generate(2026123).payload == sudoku.generate(2026123).payload


def test_tango_generation_is_deterministic():
    assert tango.generate(2026123).payload == tango.generate(2026123).payload


@pytest.mark.parametrize("seed", [1, 2, 3])
def test_generated_sudoku_has_unique_solution(seed):
    puzzle = sudoku.generate(seed)
    assert sudoku.count_solutions(puzzle.payload["given"]) == 1


@pytest.mark.parametrize("seed", [1, 2, 3])
def test_generated_tango_has_unique_solution(seed):
    puzzle = tango.generate(seed)
    assert tango.count_solutions(puzzle.payload) == 1


def test_pinpoint_generation_is_deterministic():
    assert pinpoint.generate(2026123).payload == pinpoint.generate(2026123).payload


def test_wend_generation_is_deterministic(monkeypatch):
    # Definitions come from an external dictionary; isolate it so this checks the
    # deterministic generation logic without depending on live network calls.
    monkeypatch.setattr(wend, "_lookup_definitions", lambda words: {})
    assert wend.generate(2026123).payload == wend.generate(2026123).payload


def test_patches_generation_is_deterministic():
    assert patches.generate(2026123).payload == patches.generate(2026123).payload


@pytest.mark.parametrize("seed", [1, 2, 3])
def test_generated_patches_has_unique_tiling(seed):
    puzzle = patches.generate(seed)
    assert (
        patches.count_tilings(
            puzzle.payload["seeds"], puzzle.payload["rows"], puzzle.payload["cols"]
        )
        == 1
    )


def test_all_crossclimb_pool_puzzles_are_valid_ladders():
    for puzzle in crossclimb.CROSSCLIMB_PUZZLES:
        ladder = [
            puzzle["top"]["word"],
            *[rung["word"] for rung in puzzle["rungs"]],
            puzzle["bottom"]["word"],
        ]
        assert crossclimb.is_valid_ladder(ladder) is True


@pytest.mark.parametrize("game_type", ["pinpoint", "crossclimb", "wend", "patches"])
def test_reference_solution_validates(game_type):
    spec = get_game(game_type)
    puzzle = spec.generate(spec.demo_seed)
    assert spec.validate(puzzle.payload, spec.solve(puzzle.payload)) is True


def test_crossclimb_uses_rae_clues_when_key_present(monkeypatch):
    from types import SimpleNamespace

    monkeypatch.setattr(
        crossclimb, "get_settings", lambda: SimpleNamespace(rae_key="test-key")
    )
    monkeypatch.setattr(
        crossclimb, "fetch_clue", lambda word, api_key="": f"definición de {word}"
    )

    payload = crossclimb.generate(2026200).payload

    assert payload["top"]["clue"].startswith("definición de")
    assert all(rung["clue"].startswith("definición de") for rung in payload["rungs"])
    # The generated chain is a real one-letter ladder that validates.
    assert crossclimb.validate(payload, crossclimb.solve(payload)) is True


def test_wend_includes_rae_definitions_when_key_present(monkeypatch):
    from types import SimpleNamespace

    monkeypatch.setattr(
        wend, "get_settings", lambda: SimpleNamespace(rae_key="test-key")
    )
    monkeypatch.setattr(
        wend, "fetch_clue", lambda word, api_key="": f"definición de {word}"
    )

    payload = wend.generate(2026200).payload

    assert payload["definitions"]
    assert all(
        definition.startswith("definición de")
        for definition in payload["definitions"].values()
    )
    # Every defined entry maps to one of the puzzle's target words.
    assert set(payload["definitions"]) <= set(payload["words"])


# --- Solution validation on submit ------------------------------------------


@pytest.mark.parametrize("game_type", BACKEND_GAMES)
def test_valid_solution_is_accepted(client, auth_headers, game_type):
    solution = _daily_solution(client, game_type)

    response = client.post(
        "/scores",
        json={"completion_time": 42, "game_type": game_type, "solution": solution},
        headers=auth_headers,
    )

    assert response.status_code == 201
    assert response.json()["game_type"] == game_type


@pytest.mark.parametrize("game_type", BACKEND_GAMES)
def test_missing_solution_is_rejected(client, auth_headers, game_type):
    response = client.post(
        "/scores",
        json={"completion_time": 42, "game_type": game_type},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_invalid_queens_solution_is_rejected(client, auth_headers):
    bogus = [{"row": row, "col": 0} for row in range(8)]  # all in one column

    response = client.post(
        "/scores",
        json={"completion_time": 42, "game_type": "queens", "solution": bogus},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_invalid_zip_solution_is_rejected(client, auth_headers):
    response = client.post(
        "/scores",
        json={
            "completion_time": 42,
            "game_type": "zip",
            "solution": [{"row": 0, "col": 0}],  # not a full path
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_invalid_sudoku_solution_is_rejected(client, auth_headers):
    bogus = [[1, 1, 1, 1, 1, 1] for _ in range(6)]  # every row repeats

    response = client.post(
        "/scores",
        json={"completion_time": 42, "game_type": "sudoku", "solution": bogus},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_invalid_tango_solution_is_rejected(client, auth_headers):
    bogus = [[0, 0, 0, 1, 1, 1] for _ in range(6)]  # three-in-a-row runs

    response = client.post(
        "/scores",
        json={"completion_time": 42, "game_type": "tango", "solution": bogus},
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_invalid_pinpoint_solution_is_rejected(client, auth_headers):
    response = client.post(
        "/scores",
        json={
            "completion_time": 42,
            "game_type": "pinpoint",
            "solution": "___no-such-category___",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_invalid_crossclimb_solution_is_rejected(client, auth_headers):
    response = client.post(
        "/scores",
        json={
            "completion_time": 42,
            "game_type": "crossclimb",
            "solution": ["AAAA", "BBBB"],  # not the puzzle's ladder
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# --- Buffer + fallback ------------------------------------------------------


def test_top_up_buffer_pregenerates_and_is_idempotent(db_session):
    created = puzzle_crud.top_up_buffer(db_session, days_ahead=0)
    assert created == len(PLAYABLE_GAMES)

    # Second run finds everything already generated for today.
    assert puzzle_crud.top_up_buffer(db_session, days_ahead=0) == 0


def test_serve_daily_falls_back_to_latest_when_generation_fails(
    db_session, monkeypatch
):
    yesterday = utc_today() - timedelta(days=1)
    stored = puzzle_crud.ensure_daily_puzzle(db_session, "zip", yesterday)

    def _boom(*_args, **_kwargs):
        raise RuntimeError("generation exploded")

    monkeypatch.setattr(puzzle_crud, "_generate_and_store", _boom)

    puzzle, fallback = puzzle_crud.serve_daily_puzzle(
        db_session, "zip", utc_today()
    )

    assert fallback is True
    assert puzzle.id == stored.id
