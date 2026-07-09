"""Mini Sudoku: generator, solver and validator (ported from the frontend).

Produces a 6x6 grid (2x3 boxes) with a guaranteed unique solution, built
deterministically from a seed. No external data is involved.
"""

from __future__ import annotations

from app.core.games.base import GeneratedPuzzle, Payload
from app.core.games.prng import mulberry32, shuffle_in_place

SIZE = 6
BOX_HEIGHT = 2
BOX_WIDTH = 3
CELL_COUNT = SIZE * SIZE
VALUES = [1, 2, 3, 4, 5, 6]
DEMO_SEED = 1
DEFAULT_TARGET_CLUES = 14

Grid = list[list[int]]


def _empty_grid() -> Grid:
    return [[0] * SIZE for _ in range(SIZE)]


def _clone(grid: Grid) -> Grid:
    return [row[:] for row in grid]


def _can_place(grid: Grid, row: int, col: int, value: int) -> bool:
    for i in range(SIZE):
        if grid[row][i] == value or grid[i][col] == value:
            return False
    box_row = row - (row % BOX_HEIGHT)
    box_col = col - (col % BOX_WIDTH)
    for r in range(BOX_HEIGHT):
        for c in range(BOX_WIDTH):
            if grid[box_row + r][box_col + c] == value:
                return False
    return True


def _first_empty(grid: Grid) -> tuple[int, int] | None:
    for row in range(SIZE):
        for col in range(SIZE):
            if grid[row][col] == 0:
                return row, col
    return None


def _fill_solution(grid: Grid, rng) -> bool:
    cell = _first_empty(grid)
    if cell is None:
        return True
    row, col = cell
    for value in shuffle_in_place(list(VALUES), rng):
        if not _can_place(grid, row, col, value):
            continue
        grid[row][col] = value
        if _fill_solution(grid, rng):
            return True
        grid[row][col] = 0
    return False


def count_solutions(grid: Grid, limit: int = 2) -> int:
    """Count solutions of ``grid``, short-circuiting once ``limit`` is reached."""
    working = _clone(grid)
    count = 0

    def search() -> None:
        nonlocal count
        if count >= limit:
            return
        cell = _first_empty(working)
        if cell is None:
            count += 1
            return
        row, col = cell
        for value in VALUES:
            if not _can_place(working, row, col, value):
                continue
            working[row][col] = value
            search()
            working[row][col] = 0
            if count >= limit:
                return

    search()
    return count


def _solve(given: Grid) -> Grid | None:
    grid = _clone(given)

    def search() -> bool:
        cell = _first_empty(grid)
        if cell is None:
            return True
        row, col = cell
        for value in VALUES:
            if _can_place(grid, row, col, value):
                grid[row][col] = value
                if search():
                    return True
                grid[row][col] = 0
        return False

    return _clone(grid) if search() else None


def _generate_puzzle(seed: int, target_clues: int = DEFAULT_TARGET_CLUES) -> Payload:
    rng = mulberry32(seed)

    solution = _empty_grid()
    _fill_solution(solution, rng)

    given = _clone(solution)
    positions = shuffle_in_place(
        [[i // SIZE, i % SIZE] for i in range(CELL_COUNT)], rng
    )

    clues = CELL_COUNT
    for row, col in positions:
        if clues <= target_clues:
            break
        removed = given[row][col]
        given[row][col] = 0
        if count_solutions(given, 2) == 1:
            clues -= 1
        else:
            given[row][col] = removed  # removal broke uniqueness — keep the clue

    return {
        "size": SIZE,
        "boxHeight": BOX_HEIGHT,
        "boxWidth": BOX_WIDTH,
        "given": given,
    }


def _group_complete(values: list[int], size: int) -> bool:
    return 0 not in values and len(set(values)) == size


def is_sudoku_solved(grid: Grid, size: int, box_height: int, box_width: int) -> bool:
    for row in range(size):
        if not _group_complete(grid[row], size):
            return False
    for col in range(size):
        if not _group_complete([grid[row][col] for row in range(size)], size):
            return False
    for box_row in range(0, size, box_height):
        for box_col in range(0, size, box_width):
            box = [
                grid[box_row + i][box_col + j]
                for i in range(box_height)
                for j in range(box_width)
            ]
            if not _group_complete(box, size):
                return False
    return True


def _valid_grid(solution: object, size: int) -> bool:
    if not isinstance(solution, list) or len(solution) != size:
        return False
    for row in solution:
        if not isinstance(row, list) or len(row) != size:
            return False
        for value in row:
            if type(value) is not int or not (1 <= value <= size):
                return False
    return True


def validate(payload: Payload, solution: object) -> bool:
    """Whether ``solution`` (a full 6x6 grid) solves the puzzle and keeps givens."""
    size = payload["size"]
    if not _valid_grid(solution, size):
        return False
    given = payload["given"]
    for row in range(size):
        for col in range(size):
            if given[row][col] != 0 and solution[row][col] != given[row][col]:
                return False
    return is_sudoku_solved(solution, size, payload["boxHeight"], payload["boxWidth"])


def solve(payload: Payload) -> Grid | None:
    """Return a valid completed grid for ``payload``."""
    return _solve(payload["given"])


def generate(seed: int) -> GeneratedPuzzle:
    """Deterministically generate a Mini Sudoku puzzle for ``seed``."""
    payload = _generate_puzzle(seed)
    return GeneratedPuzzle(payload=payload, solution=solve(payload))
