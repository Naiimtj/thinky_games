"""Wend: find hidden Spanish words in a letter grid (word search meets crossword).

A handful of common Spanish words are laid on an 8x8 grid along orthogonally
adjacent paths (no diagonals, no overlaps) and every remaining cell is filled
with a random letter, so the words hide among noise like a word search while
their RAE definitions act as crossword-style clues. Deterministic from a seed.
"""

from __future__ import annotations

from app.config.env import get_settings
from app.core.games.base import GeneratedPuzzle, Payload
from app.core.games.prng import mulberry32, rand_int, shuffle_in_place
from app.core.games.rae import fetch_clue
from app.core.games.wend_words import common_words

SIZE = 8
WORD_COUNT = 5  # words to hide; every other cell becomes a random filler letter
MAX_ATTEMPTS = 200  # placement retries before re-picking the word selection
DEMO_SEED = 1
# Orthogonal moves only (no diagonals): letters connect up, down, left, right.
ORTHO = (
    (-1, 0),
    (1, 0),
    (0, -1),
    (0, 1),
)
# Filler letters, weighted loosely toward Spanish frequency so the noise reads
# naturally. Accent-free and without "ñ" to match the curated word pool.
FILLER_LETTERS = "EEEEAAAAOOOOSSSRRRNNNIIILLDDTTCCUUMMPPBBGVFHYQJZ"

Coord = dict[str, int]


def _choose_words(rng) -> list[str]:
    """Pick ``WORD_COUNT`` distinct common words to hide in the grid."""
    pool = common_words()
    shuffle_in_place(pool, rng)
    return pool[:WORD_COUNT]


def _grow_path(
    grid: list[list[str]],
    length: int,
    row: int,
    col: int,
    index: int,
    visited: set[tuple[int, int]],
    path: list[tuple[int, int]],
    rng,
) -> bool:
    """Randomised DFS for a self-avoiding orthogonal path over empty cells."""
    if not (0 <= row < SIZE and 0 <= col < SIZE):
        return False
    if grid[row][col] != "" or (row, col) in visited:
        return False
    visited.add((row, col))
    path.append((row, col))
    if index == length - 1:
        return True
    for dr, dc in shuffle_in_place(list(ORTHO), rng):
        if _grow_path(grid, length, row + dr, col + dc, index + 1, visited, path, rng):
            return True
    visited.discard((row, col))
    path.pop()
    return False


def _place_word(grid: list[list[str]], word: str, rng) -> bool:
    """Write ``word`` along a random empty orthogonal path; ``False`` if none fits."""
    starts = [
        (row, col)
        for row in range(SIZE)
        for col in range(SIZE)
        if grid[row][col] == ""
    ]
    shuffle_in_place(starts, rng)
    for start_row, start_col in starts:
        path: list[tuple[int, int]] = []
        if _grow_path(grid, len(word), start_row, start_col, 0, set(), path, rng):
            for (row, col), letter in zip(path, word):
                grid[row][col] = letter
            return True
    return False


def _orthogonal_neighbours(cell: Coord) -> list[Coord]:
    result = []
    for dr, dc in ORTHO:
        row, col = cell["row"] + dr, cell["col"] + dc
        if 0 <= row < SIZE and 0 <= col < SIZE:
            result.append({"row": row, "col": col})
    return result


def _fill_grid(grid: list[list[str]], rng) -> None:
    """Fill every empty cell with a random filler letter (word-search noise)."""
    for row in range(SIZE):
        for col in range(SIZE):
            if grid[row][col] == "":
                grid[row][col] = FILLER_LETTERS[rand_int(rng, len(FILLER_LETTERS))]


def _lookup_definitions(words: list[str]) -> dict[str, str]:
    """Best-effort RAE definitions per word (only when a key is configured).

    Words the dictionary can't define are simply omitted, so a puzzle is always
    generated regardless of dictionary coverage or network state. Without a key
    no lookups happen, which keeps generation offline and deterministic.
    """
    api_key = get_settings().rae_key
    if not api_key:
        return {}
    definitions: dict[str, str] = {}
    for word in words:
        clue = fetch_clue(word, api_key)
        if clue:
            definitions[word] = clue
    return definitions


def _generate_puzzle(seed: int) -> Payload:
    rng = mulberry32(seed)

    grid: list[list[str]] = [[""] * SIZE for _ in range(SIZE)]
    words: list[str] = []
    for _ in range(MAX_ATTEMPTS):
        grid = [[""] * SIZE for _ in range(SIZE)]
        words = _choose_words(rng)
        # Place the longest words first, while the grid is still emptiest.
        if all(
            _place_word(grid, word, rng)
            for word in sorted(words, key=len, reverse=True)
        ):
            break

    _fill_grid(grid, rng)
    return {
        "size": SIZE,
        "grid": grid,
        "words": words,
        "definitions": _lookup_definitions(words),
    }


# --- Validation -------------------------------------------------------------


def _are_orthogonally_adjacent(a: Coord, b: Coord) -> bool:
    dr = abs(a["row"] - b["row"])
    dc = abs(a["col"] - b["col"])
    return dr + dc == 1


def _word_from_path(grid: list[list[str]], path: list[Coord]) -> str:
    return "".join(grid[cell["row"]][cell["col"]] for cell in path)


def _parse_path(cells: object, size: int) -> list[Coord] | None:
    if not isinstance(cells, list) or len(cells) < 2:
        return None
    seen: set[tuple[int, int]] = set()
    parsed: list[Coord] = []
    for cell in cells:
        try:
            row, col = int(cell["row"]), int(cell["col"])
        except (KeyError, TypeError, ValueError):
            return None
        if not (0 <= row < size and 0 <= col < size) or (row, col) in seen:
            return None
        seen.add((row, col))
        parsed.append({"row": row, "col": col})
    for i in range(len(parsed) - 1):
        if not _are_orthogonally_adjacent(parsed[i], parsed[i + 1]):
            return None
    return parsed


def validate(payload: Payload, solution: object) -> bool:
    """Whether the submitted paths trace every target word with valid moves."""
    if not isinstance(solution, list):
        return False
    grid, size = payload["grid"], payload["size"]
    target = set(payload["words"])
    found: set[str] = set()
    for entry in solution:
        if not isinstance(entry, dict):
            return False
        parsed = _parse_path(entry.get("cells"), size)
        if parsed is None:
            return False
        word = _word_from_path(grid, parsed)
        if word not in target:
            return False
        found.add(word)
    return found == target


def solve(payload: Payload) -> list[dict] | None:
    """Return one valid path per target word (used for reference and tests)."""
    grid, size = payload["grid"], payload["size"]

    def find_path(word: str) -> list[Coord] | None:
        def dfs(cell: Coord, index: int, visited: set, path: list[Coord]):
            if index == len(word):
                return list(path)
            for neighbour in _orthogonal_neighbours(cell):
                pos = (neighbour["row"], neighbour["col"])
                if pos in visited or grid[pos[0]][pos[1]] != word[index]:
                    continue
                visited.add(pos)
                path.append(neighbour)
                result = dfs(neighbour, index + 1, visited, path)
                if result:
                    return result
                path.pop()
                visited.discard(pos)
            return None

        for row in range(size):
            for col in range(size):
                if grid[row][col] == word[0]:
                    start = {"row": row, "col": col}
                    result = dfs(start, 1, {(row, col)}, [start])
                    if result:
                        return result
        return None

    found = []
    for word in payload["words"]:
        path = find_path(word)
        if path is None:
            return None
        found.append({"word": word, "cells": path})
    return found


def generate(seed: int) -> GeneratedPuzzle:
    """Deterministically generate a Wend puzzle for ``seed``."""
    payload = _generate_puzzle(seed)
    return GeneratedPuzzle(payload=payload, solution=solve(payload))
