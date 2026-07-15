"""Crossword puzzle generation, solving and validation."""

from __future__ import annotations

import unicodedata
from datetime import timedelta

from app.config.env import get_settings
from app.core.games.base import GeneratedPuzzle, Payload
from app.core.games.daily import utc_today
from app.core.games.prng import mulberry32, shuffle_in_place
from app.core.games.rae import fetch_clue
from app.core.games.wend_words import common_words

DEMO_SEED = 1
GRID_SIZE = 11
FALLBACK_GRID_SIZE = 7
WORD_COUNT = 5
MIN_WORD_LENGTH = 5
MAX_WORD_LENGTH = 8
MAX_RAE_CANDIDATES = 40
RECENT_WINDOW_DAYS = 90

# Each puzzle shares a compact, fully connected crossword layout. Answers are
# part of the payload because the existing client session detects a completed
# board locally before it can submit the solution to the server for validation.
CROSSWORD_PUZZLES: list[list[dict[str, object]]] = [
    [
        {"answer": "CAMA", "clue": "Mueble para dormir", "row": 1, "col": 1, "direction": "down"},
        {"answer": "CASA", "clue": "Lugar donde vives", "row": 1, "col": 3, "direction": "down"},
        {"answer": "PERA", "clue": "Fruta jugosa de forma alargada", "row": 2, "col": 2, "direction": "down"},
        {"answer": "RAMA", "clue": "Parte del arbol que nace del tronco", "row": 2, "col": 4, "direction": "down"},
        {"answer": "MESA", "clue": "Mueble con patas para comer", "row": 3, "col": 1, "direction": "across"},
    ],
    [
        {"answer": "CAMA", "clue": "Mueble para dormir", "row": 3, "col": 1, "direction": "down"},
        {"answer": "RAMA", "clue": "Parte del arbol que nace del tronco", "row": 2, "col": 2, "direction": "down"},
        {"answer": "MESA", "clue": "Mueble con patas para comer", "row": 1, "col": 3, "direction": "down"},
        {"answer": "PATO", "clue": "Ave que nada y hace cuac", "row": 2, "col": 4, "direction": "down"},
        {"answer": "CASA", "clue": "Lugar donde vives", "row": 3, "col": 1, "direction": "across"},
    ],
    [
        {"answer": "RAMA", "clue": "Parte del arbol que nace del tronco", "row": 3, "col": 1, "direction": "down"},
        {"answer": "SOPA", "clue": "Plato liquido que se toma con cuchara", "row": 2, "col": 2, "direction": "down"},
        {"answer": "MESA", "clue": "Mueble con patas para comer", "row": 1, "col": 3, "direction": "down"},
        {"answer": "CAMA", "clue": "Mueble para dormir", "row": 2, "col": 4, "direction": "down"},
        {"answer": "ROSA", "clue": "Flor con espinas", "row": 3, "col": 1, "direction": "across"},
    ],
]


def _entry_cells(entry: dict[str, object]) -> list[tuple[int, int]]:
    row = int(entry["row"])
    col = int(entry["col"])
    length = len(str(entry["answer"]))
    if entry["direction"] == "across":
        return [(row, col + offset) for offset in range(length)]
    return [(row + offset, col) for offset in range(length)]


def _normalise_answer(word: str) -> str:
    """Match browser input: uppercase Spanish letters without accents."""
    normalised = unicodedata.normalize("NFD", word)
    return "".join(
        letter for letter in normalised.upper() if "A" <= letter <= "Z"
    )


def _number_entries(entries: list[dict[str, object]]) -> list[dict[str, object]]:
    starts = sorted({(int(entry["row"]), int(entry["col"])) for entry in entries})
    numbers = {start: index + 1 for index, start in enumerate(starts)}
    return [
        {
            **entry,
            "id": f"{numbers[(int(entry['row']), int(entry['col']))]}{'A' if entry['direction'] == 'across' else 'D'}",
            "number": numbers[(int(entry["row"]), int(entry["col"]))],
        }
        for entry in entries
    ]


def _add_layout_letter(
    letters: dict[tuple[int, int], str], cell: tuple[int, int], letter: str, size: int
) -> bool:
    row, col = cell
    if not 0 <= row < size or not 0 <= col < size:
        return False
    if cell in letters and letters[cell] != letter:
        return False
    letters[cell] = letter
    return True


def _is_valid_layout(entries: list[dict[str, object]], size: int = GRID_SIZE) -> bool:
    letters: dict[tuple[int, int], str] = {}
    intersections = 0
    for entry in entries:
        for cell, letter in zip(_entry_cells(entry), str(entry["answer"])):
            intersections += int(cell in letters)
            if not _add_layout_letter(letters, cell, letter, size):
                return False
    return bool(letters) and (len(entries) < 2 or intersections >= len(entries) - 1)


def _can_place(
    letters: dict[tuple[int, int], str], word: str, row: int, col: int, direction: str
) -> bool:
    entry = {"answer": word, "row": row, "col": col, "direction": direction}
    return all(
        0 <= cell_row < GRID_SIZE
        and 0 <= cell_col < GRID_SIZE
        and letters.get((cell_row, cell_col), letter) == letter
        for (cell_row, cell_col), letter in zip(_entry_cells(entry), word)
    )


def _place_options(
    letters: dict[tuple[int, int], str],
    entries: list[dict[str, object]],
    candidate: dict[str, str],
) -> list[dict[str, object]]:
    return [
        option
        for existing in entries
        for option in _options_for_existing(letters, existing, candidate)
    ]


def _options_for_existing(
    letters: dict[tuple[int, int], str],
    existing: dict[str, object],
    candidate: dict[str, str],
) -> list[dict[str, object]]:
    direction = "down" if existing["direction"] == "across" else "across"
    options: list[dict[str, object]] = []
    for existing_cell, existing_letter in zip(
        _entry_cells(existing), str(existing["answer"])
    ):
        for index, letter in enumerate(candidate["answer"]):
            option = _crossing_option(
                letters, candidate, existing_cell, existing_letter, index, letter, direction
            )
            if option is not None:
                options.append(option)
    return options


def _crossing_option(
    letters: dict[tuple[int, int], str],
    candidate: dict[str, str],
    existing_cell: tuple[int, int],
    existing_letter: str,
    index: int,
    letter: str,
    direction: str,
) -> dict[str, object] | None:
    if letter != existing_letter:
        return None
    row = existing_cell[0] - (index if direction == "down" else 0)
    col = existing_cell[1] - (index if direction == "across" else 0)
    if not _can_place(letters, candidate["answer"], row, col, direction):
        return None
    return {**candidate, "row": row, "col": col, "direction": direction}


def _add_letters(
    letters: dict[tuple[int, int], str], entry: dict[str, object]
) -> dict[tuple[int, int], str]:
    return {**letters, **dict(zip(_entry_cells(entry), str(entry["answer"])))}


def _build_layout(candidates: list[dict[str, str]]) -> list[dict[str, object]] | None:
    """Find five connected crossing entries without inventing any words."""
    for index, candidate in enumerate(candidates):
        entry: dict[str, object] = {
            **candidate,
            "row": GRID_SIZE // 2,
            "col": (GRID_SIZE - len(candidate["answer"])) // 2,
            "direction": "across",
        }
        result = _extend_layout(
            [entry],
            _add_letters({}, entry),
            [*candidates[:index], *candidates[index + 1 :]],
        )
        if result is not None:
            return result
    return None


def _extend_layout(
    entries: list[dict[str, object]],
    letters: dict[tuple[int, int], str],
    remaining: list[dict[str, str]],
) -> list[dict[str, object]] | None:
    if len(entries) == WORD_COUNT:
        return entries if _is_valid_layout(entries) else None
    for index, candidate in enumerate(remaining):
        for entry in _place_options(letters, entries, candidate):
            result = _extend_layout(
                [*entries, entry],
                _add_letters(letters, entry),
                [*remaining[:index], *remaining[index + 1 :]],
            )
            if result is not None:
                return result
    return None


def _recent_used_words() -> set[str]:
    """Answers used by Crossword daily puzzles in the exclusion window."""
    from app.core.database.database import SessionLocal
    from app.core.database.models import DailyPuzzle

    cutoff = utc_today() - timedelta(days=RECENT_WINDOW_DAYS)
    db = SessionLocal()
    try:
        rows = (
            db.query(DailyPuzzle.payload)
            .filter(
                DailyPuzzle.game_type == "crossword",
                DailyPuzzle.puzzle_date >= cutoff,
            )
            .all()
        )
    except Exception:  # pragma: no cover - never block generation on DB failure
        return set()
    finally:
        db.close()

    return {
        entry["answer"]
        for (payload,) in rows
        for entry in payload.get("entries", [])
        if isinstance(entry.get("answer"), str)
    }


def _generate_from_rae(
    seed: int, api_key: str, excluded: set[str]
) -> list[dict[str, object]] | None:
    candidates: list[dict[str, str]] = []
    seen = set(excluded)
    pool = [
        word
        for word in common_words()
        if MIN_WORD_LENGTH <= len(word) <= MAX_WORD_LENGTH and word not in seen
    ]
    shuffle_in_place(pool, mulberry32(seed))
    for word in pool[:MAX_RAE_CANDIDATES]:
        answer = _normalise_answer(word)
        clue = fetch_clue(word, api_key)
        if clue is None:
            continue
        seen.add(answer)
        candidates.append({"answer": answer, "clue": clue})
        if len(candidates) >= WORD_COUNT:
            layout = _build_layout(candidates)
            if layout is not None:
                return _number_entries(layout)
    return None


def _generate_puzzle(seed: int) -> Payload:
    api_key = get_settings().rae_key
    if api_key:
        entries = _generate_from_rae(seed, api_key, _recent_used_words())
        if entries is not None:
            return {"size": GRID_SIZE, "entries": entries}
    entries = _number_entries(CROSSWORD_PUZZLES[seed % len(CROSSWORD_PUZZLES)])
    return {"size": FALLBACK_GRID_SIZE, "entries": entries}


def validate(payload: Payload, solution: object) -> bool:
    """Whether every submitted crossword entry matches its answer exactly."""
    if not isinstance(solution, dict):
        return False
    answers = {entry["id"]: entry["answer"] for entry in payload["entries"]}
    return solution == answers


def solve(payload: Payload) -> dict[str, str]:
    """Return the answer keyed by entry id."""
    return {entry["id"]: entry["answer"] for entry in payload["entries"]}


def generate(seed: int) -> GeneratedPuzzle:
    """Generate an automatic RAE crossword with an offline fallback."""
    payload = _generate_puzzle(seed)
    return GeneratedPuzzle(payload=payload, solution=solve(payload))