"""Wend: find hidden Spanish words in a letter grid (word search meets crossword).

A handful of common Spanish words are laid on an 8x8 grid along straight lines
(horizontal, vertical or diagonal — never bent/snaking) and every remaining
cell is filled with a random letter, so the words hide among noise like a word
search while their curated definitions act as crossword-style clues. Two words may
legitimately cross at a shared cell the way real crossword entries do, but only
when both agree on the letter there — that intersection cell then belongs to
both words at once and stays usable for either of them, so finding one word
first can never lock the other out. Deterministic from a seed.
"""

from __future__ import annotations

from app.core.games.base import GeneratedPuzzle, Payload
from app.core.games.localized_words import common_words
from app.core.games.prng import mulberry32, rand_int, shuffle_in_place

SIZE = 8
WORD_COUNT = 5  # words to hide; every other cell becomes a random filler letter
MAX_ATTEMPTS = 200  # placement retries before re-picking the word selection
DEMO_SEED = 1
SHORT_WORD_TARGET = 1
MEDIUM_WORD_TARGET = 3
LONG_WORD_TARGET = 1
MIN_STRAIGHT_WORDS = 1
REQUIRED_DIAGONAL_WORDS = 1
# The eight straight-line directions a word can run along: horizontal,
# vertical and diagonal, in both senses of each axis. Words are always drawn
# in one fixed direction end to end — they never bend or double back.
DIRECTIONS = (
    (0, 1),
    (0, -1),
    (1, 0),
    (-1, 0),
    (1, 1),
    (1, -1),
    (-1, 1),
    (-1, -1),
)
# Filler letters, weighted loosely toward Spanish frequency so the noise reads
# naturally. Accent-free and without "ñ" to match the curated word pool.
FILLER_LETTERS = "EEEEAAAAOOOOSSSRRRNNNIIILLDDTTCCUUMMPPBBGVFHYQJZ"

Coord = dict[str, int]


def _choose_words(rng, lang: str = "es") -> list[str]:
    """Pick words with a stable difficulty profile by length.

    Target distribution:
    - 1 word of length 3-4
    - 3 words of length 5-6
    - 1 word of length 7-8

    If the available locale pool cannot satisfy one bucket, we keep generation
    resilient by filling the remaining slots from the rest of the pool.
    """
    normalized_pool = [
        _normalize_word(entry.answer)
        for entry in common_words(lang)
        if 3 <= len(_normalize_word(entry.answer)) <= SIZE
    ]

    # Deduplicate while preserving order from the curated/source pool.
    seen: set[str] = set()
    pool: list[str] = []
    for word in normalized_pool:
        if word in seen:
            continue
        seen.add(word)
        pool.append(word)

    short_words = [word for word in pool if len(word) <= 4]
    medium_words = [word for word in pool if 5 <= len(word) <= 6]
    long_words = [word for word in pool if 7 <= len(word) <= 8]
    shuffle_in_place(short_words, rng)
    shuffle_in_place(medium_words, rng)
    shuffle_in_place(long_words, rng)

    selected: list[str] = []
    selected.extend(short_words[:SHORT_WORD_TARGET])
    selected.extend(medium_words[:MEDIUM_WORD_TARGET])
    selected.extend(long_words[:LONG_WORD_TARGET])

    if len(selected) < WORD_COUNT:
        leftovers = [word for word in pool if word not in set(selected)]
        shuffle_in_place(leftovers, rng)
        selected.extend(leftovers[: WORD_COUNT - len(selected)])

    shuffle_in_place(selected, rng)
    return selected[:WORD_COUNT]


def _fits_straight_line(
    grid: list[list[str]], word: str, row: int, col: int, dr: int, dc: int
) -> bool:
    """Whether ``word`` can run straight from ``(row, col)`` along ``(dr, dc)``.

    A cell already holding a different word's letter blocks the placement; a
    cell holding the *same* letter is a valid crossword-style intersection.
    """
    end_row = row + dr * (len(word) - 1)
    end_col = col + dc * (len(word) - 1)
    if not (0 <= end_row < SIZE and 0 <= end_col < SIZE):
        return False
    for index, letter in enumerate(word):
        existing = grid[row + dr * index][col + dc * index]
        if existing != "" and existing != letter:
            return False
    return True


def _is_diagonal(dr: int, dc: int) -> bool:
    return dr != 0 and dc != 0


def _count_diagonal_words(grid: list[list[str]], words: list[str]) -> int:
    """Count target words that have at least one diagonal occurrence in ``grid``."""
    count = 0
    for word in words:
        length = len(word)
        has_diagonal = False
        for row in range(SIZE):
            if has_diagonal:
                break
            for col in range(SIZE):
                if grid[row][col] != word[0]:
                    continue
                for dr, dc in DIRECTIONS:
                    if not _is_diagonal(dr, dc):
                        continue
                    end_row = row + dr * (length - 1)
                    end_col = col + dc * (length - 1)
                    if not (0 <= end_row < SIZE and 0 <= end_col < SIZE):
                        continue
                    if all(
                        grid[row + dr * i][col + dc * i] == letter
                        for i, letter in enumerate(word)
                    ):
                        has_diagonal = True
                        break
                if has_diagonal:
                    break
        if has_diagonal:
            count += 1
    return count


def _place_word(
    grid: list[list[str]],
    word: str,
    rng,
    allowed_directions: list[tuple[int, int]] | None = None,
) -> tuple[int, int] | None:
    """Write ``word`` along a random straight line; returns direction or ``None``.

    Existing letters from other words may be reused as intersections (when the
    letter matches), but a placement is never allowed to overwrite a
    conflicting letter — that would corrupt the other word.
    """
    starts = [(row, col) for row in range(SIZE) for col in range(SIZE)]
    shuffle_in_place(starts, rng)
    directions = list(allowed_directions or DIRECTIONS)
    for row, col in starts:
        shuffle_in_place(directions, rng)
        for dr, dc in directions:
            if _fits_straight_line(grid, word, row, col, dr, dc):
                for index, letter in enumerate(word):
                    grid[row + dr * index][col + dc * index] = letter
                return dr, dc
    return None


def _fill_grid(grid: list[list[str]], rng) -> None:
    """Fill every empty cell with a random filler letter (word-search noise)."""
    for row in range(SIZE):
        for col in range(SIZE):
            if grid[row][col] == "":
                grid[row][col] = FILLER_LETTERS[rand_int(rng, len(FILLER_LETTERS))]


def _lookup_definitions(words: list[str], lang: str = "es") -> dict[str, str]:
    """Return localized curated clues without network-dependent generation."""
    curated = {_normalize_word(entry.answer): entry.clue for entry in common_words(lang)}
    return {word: curated[word] for word in words if word in curated}


def _normalize_word(word: str) -> str:
    """Uppercase and strip accents for Wend grid matching."""
    import unicodedata

    normalized = unicodedata.normalize("NFD", word)
    return "".join(letter for letter in normalized.upper() if "A" <= letter <= "Z")


def _generate_puzzle(seed: int, lang: str = "es") -> Payload:
    rng = mulberry32(seed)

    grid: list[list[str]] = [[""] * SIZE for _ in range(SIZE)]
    words: list[str] = []
    for _ in range(MAX_ATTEMPTS):
        grid = [[""] * SIZE for _ in range(SIZE)]
        words = _choose_words(rng, lang)
        ordered_words = sorted(words, key=len, reverse=True)
        diagonal_word_index = rand_int(rng, len(ordered_words))
        diagonal_word = ordered_words[diagonal_word_index]
        diagonal_directions = [d for d in DIRECTIONS if _is_diagonal(*d)]
        straight_directions = [d for d in DIRECTIONS if not _is_diagonal(*d)]

        diagonal_direction = _place_word(
            grid, diagonal_word, rng, diagonal_directions
        )
        if diagonal_direction is None:
            continue

        placed_all = True
        for word in ordered_words:
            if word == diagonal_word:
                continue
            direction = _place_word(grid, word, rng, straight_directions)
            if direction is None:
                placed_all = False
                break

        diagonal_words = _count_diagonal_words(grid, words)
        if (
            placed_all
            and diagonal_words == REQUIRED_DIAGONAL_WORDS
            and len(words) - diagonal_words >= MIN_STRAIGHT_WORDS
        ):
            break

    _fill_grid(grid, rng)
    return {
        "size": SIZE,
        "grid": grid,
        "words": words,
        "definitions": _lookup_definitions(words, lang),
    }


# --- Validation -------------------------------------------------------------


def _straight_direction(a: Coord, b: Coord) -> tuple[int, int] | None:
    """The unit step from ``a`` to ``b`` if they're adjacent (incl. diagonally)."""
    dr = b["row"] - a["row"]
    dc = b["col"] - a["col"]
    if abs(dr) > 1 or abs(dc) > 1 or (dr == 0 and dc == 0):
        return None
    return dr, dc


def _word_from_path(grid: list[list[str]], path: list[Coord]) -> str:
    return "".join(grid[cell["row"]][cell["col"]] for cell in path)


def _parse_path(cells: object, size: int) -> list[Coord] | None:
    """Parse and validate a submitted path: in-bounds, non-repeating, and a
    single unbroken straight line — horizontal, vertical or diagonal, never
    bent or snaking.
    """
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
    direction = _straight_direction(parsed[0], parsed[1])
    if direction is None:
        return None
    for i in range(1, len(parsed) - 1):
        if _straight_direction(parsed[i], parsed[i + 1]) != direction:
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
    """Return one valid straight-line path per target word (reference/tests)."""
    grid, size = payload["grid"], payload["size"]

    def find_path(word: str) -> list[Coord] | None:
        length = len(word)
        for row in range(size):
            for col in range(size):
                if grid[row][col] != word[0]:
                    continue
                for dr, dc in DIRECTIONS:
                    end_row = row + dr * (length - 1)
                    end_col = col + dc * (length - 1)
                    if not (0 <= end_row < size and 0 <= end_col < size):
                        continue
                    if all(
                        grid[row + dr * i][col + dc * i] == letter
                        for i, letter in enumerate(word)
                    ):
                        return [
                            {"row": row + dr * i, "col": col + dc * i}
                            for i in range(length)
                        ]
        return None

    found = []
    for word in payload["words"]:
        path = find_path(word)
        if path is None:
            return None
        found.append({"word": word, "cells": path})
    return found


def generate(seed: int, lang: str = "es") -> GeneratedPuzzle:
    """Deterministically generate a Wend puzzle for ``seed``."""
    payload = _generate_puzzle(seed, lang)
    return GeneratedPuzzle(payload=payload, solution=solve(payload))

