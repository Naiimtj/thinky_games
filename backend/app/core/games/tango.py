"""Tango: generator, solver and validator (ported from the frontend).

Builds a 6x6 sun/moon grid whose unique solution satisfies the Tango rules
(three of each per row/column, never three in a row, and all =/x links), then
reduces the givens + constraints to a minimal set that still forces a single
solution. Deterministic from a seed. No external data is involved.
"""

from __future__ import annotations

from typing import Callable

from app.core.games.base import GeneratedPuzzle, Payload
from app.core.games.prng import mulberry32, shuffle_in_place

SIZE = 6
HALF = SIZE // 2
DEMO_SEED = 1
SUN = 0
MOON = 1
EMPTY = -1

Grid = list[list[int]]


def _cell_index(row: int, col: int) -> int:
    return row * SIZE + col


def _empty_grid() -> Grid:
    return [[EMPTY] * SIZE for _ in range(SIZE)]


def _placement_ok(grid, row_count, col_count, row, col, value) -> bool:
    if row_count[row][value] + 1 > HALF:
        return False
    if col_count[col][value] + 1 > HALF:
        return False
    if col >= 2 and grid[row][col - 1] == value and grid[row][col - 2] == value:
        return False
    if row >= 2 and grid[row - 1][col] == value and grid[row - 2][col] == value:
        return False
    return True


def _generate_solution(rng) -> Grid:
    grid = _empty_grid()
    row_count = [[0, 0] for _ in range(SIZE)]
    col_count = [[0, 0] for _ in range(SIZE)]

    def place(pos: int) -> bool:
        if pos == SIZE * SIZE:
            return True
        row, col = pos // SIZE, pos % SIZE
        for value in shuffle_in_place([SUN, MOON], rng):
            if not _placement_ok(grid, row_count, col_count, row, col, value):
                continue
            grid[row][col] = value
            row_count[row][value] += 1
            col_count[col][value] += 1
            if place(pos + 1):
                return True
            grid[row][col] = EMPTY
            row_count[row][value] -= 1
            col_count[col][value] -= 1
        return False

    place(0)
    return grid


def _constraints_by_trigger(constraints: list[dict]) -> dict[int, list[dict]]:
    by_trigger: dict[int, list[dict]] = {}
    for constraint in constraints:
        trigger = max(
            _cell_index(constraint["a"]["row"], constraint["a"]["col"]),
            _cell_index(constraint["b"]["row"], constraint["b"]["col"]),
        )
        by_trigger.setdefault(trigger, []).append(constraint)
    return by_trigger


def _constraint_holds(grid: Grid, constraint: dict) -> bool:
    a, b = constraint["a"], constraint["b"]
    av = grid[a["row"]][a["col"]]
    bv = grid[b["row"]][b["col"]]
    return av == bv if constraint["type"] == "=" else av != bv


def _search(puzzle: Payload, on_solution: Callable[[Grid], bool]) -> None:
    given = puzzle["given"]
    constraints = puzzle["constraints"]
    grid = _empty_grid()
    row_count = [[0, 0] for _ in range(SIZE)]
    col_count = [[0, 0] for _ in range(SIZE)]
    fixed = _empty_grid()
    for item in given:
        fixed[item["row"]][item["col"]] = item["value"]
    triggers = _constraints_by_trigger(constraints)
    keep_going = True

    def try_value(pos, row, col, value, advance) -> None:
        if not _placement_ok(grid, row_count, col_count, row, col, value):
            return
        grid[row][col] = value
        row_count[row][value] += 1
        col_count[col][value] += 1
        triggered = triggers.get(pos)
        if triggered is None or all(_constraint_holds(grid, c) for c in triggered):
            advance()
        grid[row][col] = EMPTY
        row_count[row][value] -= 1
        col_count[col][value] -= 1

    def recurse(pos: int) -> None:
        nonlocal keep_going
        if not keep_going:
            return
        if pos == SIZE * SIZE:
            keep_going = on_solution(grid)
            return
        row, col = pos // SIZE, pos % SIZE
        forced = fixed[row][col]
        if forced != EMPTY:
            try_value(pos, row, col, forced, lambda: recurse(pos + 1))
            return
        try_value(pos, row, col, SUN, lambda: recurse(pos + 1))
        if keep_going:
            try_value(pos, row, col, MOON, lambda: recurse(pos + 1))

    recurse(0)


def count_solutions(puzzle: Payload, limit: int = 2) -> int:
    """Count solutions of ``puzzle``, short-circuiting at ``limit``."""
    count = 0

    def on_solution(_grid: Grid) -> bool:
        nonlocal count
        count += 1
        return count < limit

    _search(puzzle, on_solution)
    return count


def solve_tango(puzzle: Payload) -> Grid | None:
    """Return the first solution grid for ``puzzle``, or ``None``."""
    solution: Grid | None = None

    def on_solution(grid: Grid) -> bool:
        nonlocal solution
        solution = [row[:] for row in grid]
        return False

    _search(puzzle, on_solution)
    return solution


def _generate_puzzle(seed: int) -> Payload:
    rng = mulberry32(seed)
    solution = _generate_solution(rng)

    givens: list[dict] = []
    constraints: list[dict] = []
    for row in range(SIZE):
        for col in range(SIZE):
            givens.append({"row": row, "col": col, "value": solution[row][col]})
            if col + 1 < SIZE:
                constraints.append(
                    {
                        "a": {"row": row, "col": col},
                        "b": {"row": row, "col": col + 1},
                        "type": "=" if solution[row][col] == solution[row][col + 1] else "×",
                    }
                )
            if row + 1 < SIZE:
                constraints.append(
                    {
                        "a": {"row": row, "col": col},
                        "b": {"row": row + 1, "col": col},
                        "type": "=" if solution[row][col] == solution[row + 1][col] else "×",
                    }
                )

    # Start fully specified (trivially unique) and greedily drop clues that
    # aren't needed to keep the solution unique.
    given_set = list(givens)
    constraint_set = list(constraints)
    clues = shuffle_in_place(
        [{"kind": "given", "ref": g} for g in givens]
        + [{"kind": "constraint", "ref": c} for c in constraints],
        rng,
    )

    for clue in clues:
        if clue["kind"] == "given":
            trial_givens = [g for g in given_set if g is not clue["ref"]]
            trial_constraints = constraint_set
        else:
            trial_givens = given_set
            trial_constraints = [c for c in constraint_set if c is not clue["ref"]]
        still_unique = (
            count_solutions(
                {
                    "size": SIZE,
                    "given": trial_givens,
                    "constraints": trial_constraints,
                },
                2,
            )
            == 1
        )
        if still_unique:
            given_set = trial_givens
            constraint_set = trial_constraints

    return {"size": SIZE, "given": given_set, "constraints": constraint_set}


def is_tango_solved(grid: Grid, size: int, constraints: list[dict]) -> bool:
    for row in range(size):
        for col in range(size):
            if grid[row][col] == EMPTY:
                return False
    half = size // 2
    for i in range(size):
        row_sun = 0
        col_sun = 0
        for j in range(size):
            if grid[i][j] == SUN:
                row_sun += 1
            if grid[j][i] == SUN:
                col_sun += 1
            if j >= 2:
                if grid[i][j] == grid[i][j - 1] and grid[i][j] == grid[i][j - 2]:
                    return False
                if grid[j][i] == grid[j - 1][i] and grid[j][i] == grid[j - 2][i]:
                    return False
        if row_sun != half or col_sun != half:
            return False
    return all(_constraint_holds(grid, c) for c in constraints)


def _valid_grid(solution: object, size: int) -> bool:
    if not isinstance(solution, list) or len(solution) != size:
        return False
    for row in solution:
        if not isinstance(row, list) or len(row) != size:
            return False
        for value in row:
            if type(value) is not int or value not in (SUN, MOON):
                return False
    return True


def validate(payload: Payload, solution: object) -> bool:
    """Whether ``solution`` (a full 6x6 grid of suns/moons) solves the puzzle."""
    size = payload["size"]
    if not _valid_grid(solution, size):
        return False
    for item in payload["given"]:
        if solution[item["row"]][item["col"]] != item["value"]:
            return False
    return is_tango_solved(solution, size, payload["constraints"])


def solve(payload: Payload) -> Grid | None:
    """Return a valid completed grid for ``payload``."""
    return solve_tango(payload)


def generate(seed: int) -> GeneratedPuzzle:
    """Deterministically generate a Tango puzzle for ``seed``."""
    payload = _generate_puzzle(seed)
    return GeneratedPuzzle(payload=payload, solution=solve(payload))
