"""Tests for backend puzzle generation, delivery and solution validation."""

from datetime import timedelta

import pytest

from app.core.crud import puzzles as puzzle_crud
from app.core.database.models import DailyPuzzle
from app.core.games import crossword, patches, pinpoint, queens, sudoku, tango, wend
from app.core.games import zip as zip_puzzle
from app.core.games.daily import utc_today
from app.core.games.localized_words import puzzle_locales
from app.core.games.registry import PLAYABLE_GAMES, get_game

BACKEND_GAMES = [
    "queens",
    "zip",
    "tango",
    "sudoku",
    "pinpoint",
    "crossword",
    "wend",
    "patches",
]


def _daily_solution(client, game_type, lang="es"):
    """Fetch today's puzzle and compute a valid solution via the backend solver."""
    payload = client.get(
        f"/games/{game_type}/daily?lang={lang}"
    ).json()["payload"]
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


@pytest.mark.parametrize("game_type", ["pinpoint", "crossword", "wend"])
def test_word_game_demo_is_localized(client, game_type):
    spanish = client.get(f"/games/{game_type}/daily?mode=demo&lang=es")
    english = client.get(f"/games/{game_type}/daily?mode=demo&lang=en")
    german = client.get(f"/games/{game_type}/daily?mode=demo&lang=de")

    assert spanish.status_code == english.status_code == german.status_code == 200
    assert spanish.json()["locale"] == "es"
    assert english.json()["locale"] == "en"
    assert german.json()["locale"] == "de"
    assert spanish.json()["payload"] != english.json()["payload"]
    assert english.json()["payload"] != german.json()["payload"]


@pytest.mark.parametrize("game_type", ["pinpoint", "crossword", "wend"])
def test_word_game_daily_puzzles_are_stored_per_locale(client, db_session, game_type):
    spanish = client.get(f"/games/{game_type}/daily?lang=es").json()
    english = client.get(f"/games/{game_type}/daily?lang=en").json()

    assert spanish["locale"] == "es"
    assert english["locale"] == "en"
    assert spanish["payload"] != english["payload"]
    assert (
        db_session.query(DailyPuzzle)
        .filter(DailyPuzzle.game_type == game_type)
        .count()
        == 2
    )


# --- Generation properties --------------------------------------------------


def test_queens_generation_is_deterministic():
    assert queens.generate(2026123).payload == queens.generate(2026123).payload


def test_zip_generation_is_deterministic():
    assert zip_puzzle.generate(2026123).payload == zip_puzzle.generate(2026123).payload


@pytest.mark.parametrize("seed", [1, 2, 3])
def test_generated_zip_has_unique_solution(seed):
    puzzle = zip_puzzle.generate(seed)
    assert zip_puzzle.count_solutions(puzzle.payload) == 1


def _find_zip_alternative_solution(payload, canonical):
    """Find a full non-repeating path that differs from the canonical path."""
    size = payload["size"]
    total = size * size
    checkpoints = payload["checkpoints"]
    checkpoint_order = {(cp["row"], cp["col"]): cp["order"] for cp in checkpoints}
    wall_set = zip_puzzle.build_wall_set(payload["walls"])

    def visited_checkpoint_orders(path):
        return [
            checkpoint_order[(cell["row"], cell["col"])]
            for cell in path
            if (cell["row"], cell["col"]) in checkpoint_order
        ]

    def checkpoints_are_valid(sequence):
        return len(sequence) == len(checkpoints) and all(
            index == 0 or sequence[index] > sequence[index - 1]
            for index in range(len(sequence))
        )

    for start_row in range(size):
        for start_col in range(size):
            start = {"row": start_row, "col": start_col}
            visited = {(start_row, start_col)}
            trail = [start]
            seen_orders = []
            start_order = checkpoint_order.get((start_row, start_col))
            if start_order is not None:
                seen_orders.append(start_order)

            alternative = None

            def dfs(cell):
                nonlocal alternative
                if alternative is not None:
                    return

                if len(trail) == total:
                    sequence = visited_checkpoint_orders(trail)
                    if checkpoints_are_valid(sequence) and trail != canonical:
                        alternative = [dict(step) for step in trail]
                    return

                for neighbour in zip_puzzle._neighbours(cell, size):
                    key = (neighbour["row"], neighbour["col"])
                    if key in visited:
                        continue
                    if not zip_puzzle.can_connect(wall_set, cell, neighbour):
                        continue

                    next_order = checkpoint_order.get(key)
                    if (
                        next_order is not None
                        and seen_orders
                        and next_order <= seen_orders[-1]
                    ):
                        continue

                    visited.add(key)
                    trail.append(neighbour)
                    if next_order is not None:
                        seen_orders.append(next_order)

                    dfs(neighbour)

                    if next_order is not None:
                        seen_orders.pop()
                    trail.pop()
                    visited.remove(key)

            dfs(start)
            if alternative is not None:
                return alternative

    return None


def test_zip_validate_rejects_path_that_does_not_start_at_checkpoint_one():
    payload = zip_puzzle.generate(1).payload
    canonical = zip_puzzle.solve(payload)
    checkpoint_one = next(cp for cp in payload["checkpoints"] if cp["order"] == 1)

    alternative = _find_zip_alternative_solution(payload, canonical)

    assert alternative is not None
    assert alternative != canonical
    assert alternative[0] != {
        "row": checkpoint_one["row"],
        "col": checkpoint_one["col"],
    }
    assert zip_puzzle.validate(payload, alternative) is False


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


@pytest.mark.parametrize("seed", [1, 2, 3])
def test_generated_tango_has_at_least_five_givens(seed):
    puzzle = tango.generate(seed)
    assert len(puzzle.payload["given"]) >= 5


def test_pinpoint_generation_is_deterministic():
    assert pinpoint.generate(2026123).payload == pinpoint.generate(2026123).payload


def test_wend_generation_is_deterministic(monkeypatch):
    # Definitions come from an external dictionary; isolate it so this checks the
    # deterministic generation logic without depending on live network calls.
    monkeypatch.setattr(wend, "_lookup_definitions", lambda words, lang="es": {})
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


def test_all_crossword_layouts_are_valid():
    for puzzle in crossword.CROSSWORD_PUZZLES:
        assert crossword._is_valid_layout(puzzle) is True


def test_crossword_uses_curated_words_and_excludes_recent_answers(monkeypatch):
    from types import SimpleNamespace

    from app.core.games.localized_words import WordEntry

    monkeypatch.setattr(
        crossword,
        "get_settings",
        lambda: SimpleNamespace(
            dictionary_service_url="",
        ),
    )
    monkeypatch.setattr(
        crossword,
        "_recent_used_words",
        lambda target_date, lang="es": {"USADO"},
    )
    monkeypatch.setattr(
        crossword,
        "common_words",
        lambda lang="es": [
            WordEntry("USADO", "descartado"),
            WordEntry("CAMINO", "pista camino"),
            WordEntry("MARINO", "pista marino"),
            WordEntry("RATON", "pista raton"),
            WordEntry("TORRE", "pista torre"),
            WordEntry("RITMO", "pista ritmo"),
        ],
    )
    monkeypatch.setattr(crossword, "shuffle_in_place", lambda words, rng: words)

    payload = crossword.generate_for_date(2026200, "es", utc_today()).payload

    assert payload["size"] == crossword.GRID_SIZE
    assert len(payload["entries"]) == crossword.WORD_COUNT
    assert "USADO" not in {entry["answer"] for entry in payload["entries"]}
    assert all(entry["clue"].startswith("pista ") for entry in payload["entries"])
    assert crossword._is_valid_layout(payload["entries"]) is True
    assert crossword.validate(payload, crossword.solve(payload)) is True


@pytest.mark.parametrize("game_type", ["pinpoint", "crossword", "wend", "patches"])
def test_reference_solution_validates(game_type):
    spec = get_game(game_type)
    puzzle = spec.generate(spec.demo_seed)
    assert spec.validate(puzzle.payload, spec.solve(puzzle.payload)) is True


def test_wend_includes_definitions_when_available(monkeypatch):
    """Definitions are sourced from the curated pool; definitions are present."""
    payload = wend.generate(2026200).payload

    assert payload["definitions"]
    # Every defined entry maps to one of the puzzle's target words.
    assert set(payload["definitions"]) <= set(payload["words"])


@pytest.mark.parametrize("seed", [1, 2, 3])
def test_wend_uses_requested_word_length_profile(seed):
    payload = wend.generate(seed, "es").payload
    words = payload["words"]

    short_count = sum(len(word) <= 4 for word in words)
    medium_count = sum(5 <= len(word) <= 6 for word in words)
    long_count = sum(7 <= len(word) <= 8 for word in words)

    assert short_count == 1
    assert medium_count == 3
    assert long_count == 1


@pytest.mark.parametrize("seed", [1, 2, 3])
def test_wend_has_exactly_one_diagonal_word(seed):
    payload = wend.generate(seed, "es").payload
    grid = payload["grid"]
    size = payload["size"]

    diagonal_word_count = 0
    for word in payload["words"]:
        length = len(word)
        found_diagonal_for_word = False
        for row in range(size):
            if found_diagonal_for_word:
                break
            for col in range(size):
                if grid[row][col] != word[0]:
                    continue
                for dr, dc in wend.DIRECTIONS:
                    if dr == 0 or dc == 0:
                        continue
                    end_row = row + dr * (length - 1)
                    end_col = col + dc * (length - 1)
                    if not (0 <= end_row < size and 0 <= end_col < size):
                        continue
                    if all(
                        grid[row + dr * i][col + dc * i] == letter
                        for i, letter in enumerate(word)
                    ):
                        found_diagonal_for_word = True
                        break
                if found_diagonal_for_word:
                    break
        if found_diagonal_for_word:
            diagonal_word_count += 1

    assert diagonal_word_count == 1


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


@pytest.mark.parametrize("game_type", ["pinpoint", "crossword", "wend"])
def test_localized_word_game_solution_is_accepted(client, auth_headers, game_type):
    solution = _daily_solution(client, game_type, lang="en")

    response = client.post(
        "/scores",
        json={
            "completion_time": 42,
            "game_type": game_type,
            "locale": "en",
            "solution": solution,
        },
        headers=auth_headers,
    )

    assert response.status_code == 201


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


def test_invalid_crossword_solution_is_rejected(client, auth_headers):
    response = client.post(
        "/scores",
        json={
            "completion_time": 42,
            "game_type": "crossword",
            "solution": {"1A": "AAAA"},
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


# --- Buffer + fallback ------------------------------------------------------


def test_top_up_buffer_pregenerates_and_is_idempotent(db_session):
    created = puzzle_crud.top_up_buffer(db_session, days_ahead=0)
    assert created == sum(len(puzzle_locales(spec.id)) for spec in PLAYABLE_GAMES)

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
