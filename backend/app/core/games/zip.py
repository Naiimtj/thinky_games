"""Zip puzzle: generator, solver and validator (ported from the frontend).

1. Build a random Hamiltonian path over the whole grid using the "backbite"
   transformation (which turns one Hamiltonian path into another).
2. Number some of its cells as ascending checkpoints - the path visits them in
   order by construction.
3. Add walls (only on edges the path never uses) until the puzzle has a single
   solution, then drop any wall that isn't needed.

Deterministic from a seed, so the daily is shared by all players.
"""

from __future__ import annotations

from typing import Callable

from app.core.games.base import GeneratedPuzzle, Payload
from app.core.games.prng import Rng, mulberry32, rand_int, shuffle_in_place

SIZE = 6
CHECKPOINT_COUNT = 8
DEMO_SEED = 1
OFFSETS = ((-1, 0), (1, 0), (0, -1), (0, 1))

Coord = dict[str, int]


def _key(row: int, col: int) -> str:
    return f"{row},{col}"


def _wall_key(a: Coord, b: Coord) -> str:
    """Order-independent key identifying the wall between two cells."""
    return "|".join(sorted([_key(a["row"], a["col"]), _key(b["row"], b["col"])]))


def build_wall_set(walls: list[dict] | None) -> set[str]:
    """Build a set of blocked edges from the puzzle's wall list."""
    blocked: set[str] = set()
    for wall in walls or []:
        blocked.add(_wall_key(wall["from"], wall["to"]))
    return blocked


def _are_adjacent(a: Coord, b: Coord) -> bool:
    return abs(a["row"] - b["row"]) + abs(a["col"] - b["col"]) == 1


def can_connect(wall_set: set[str], a: Coord, b: Coord) -> bool:
    """True when the player may move directly between two cells."""
    return _are_adjacent(a, b) and _wall_key(a, b) not in wall_set


def _neighbours(cell: Coord, size: int) -> list[Coord]:
    result = []
    for dr, dc in OFFSETS:
        row, col = cell["row"] + dr, cell["col"] + dc
        if 0 <= row < size and 0 <= col < size:
            result.append({"row": row, "col": col})
    return result


def _range6(reverse: bool) -> list[int]:
    cols = list(range(SIZE))
    return cols[::-1] if reverse else cols


def _snake_path() -> list[Coord]:
    """A boustrophedon (snake) path - the starting Hamiltonian path for backbite."""
    path: list[Coord] = []
    for row in range(SIZE):
        for col in _range6(row % 2 == 1):
            path.append({"row": row, "col": col})
    return path


def _reverse_segment(
    path: list[Coord], index: dict[str, int], lo: int, hi: int
) -> None:
    while lo < hi:
        path[lo], path[hi] = path[hi], path[lo]
        index[_key(path[lo]["row"], path[lo]["col"])] = lo
        index[_key(path[hi]["row"], path[hi]["col"])] = hi
        lo += 1
        hi -= 1


def _random_hamiltonian_path(rng: Rng) -> list[Coord]:
    """Randomise a Hamiltonian path via repeated backbite moves."""
    path = _snake_path()
    index = {_key(cell["row"], cell["col"]): i for i, cell in enumerate(path)}
    moves = SIZE * SIZE * 40

    for _ in range(moves):
        at_tail = rng() < 0.5
        end_cell = path[-1] if at_tail else path[0]
        neighbour = shuffle_in_place(_neighbours(end_cell, SIZE), rng)[0]
        i = index[_key(neighbour["row"], neighbour["col"])]
        if at_tail and i < len(path) - 1:
            _reverse_segment(path, index, i + 1, len(path) - 1)
        elif not at_tail and i > 0:
            _reverse_segment(path, index, 0, i - 1)
    return path


def _choose_checkpoints(path: list[Coord], rng: Rng) -> list[dict[str, int]]:
    """Number ``CHECKPOINT_COUNT`` cells of the path in ascending path order.

    The first and last cells of the path are always checkpoints, so the
    solved path always starts on "1" and ends on the highest number - it
    would be confusing to fill the last cells after the last checkpoint.
    """
    last = len(path) - 1
    indices = {0, last}
    while len(indices) < CHECKPOINT_COUNT:
        indices.add(1 + rand_int(rng, last - 1))
    return [
        {
            "row": path[path_index]["row"],
            "col": path[path_index]["col"],
            "order": order + 1,
        }
        for order, path_index in enumerate(sorted(indices))
    ]


def _search(puzzle: Payload, on_solution: Callable[[list[Coord]], bool]) -> None:
    """Depth-first search over the constrained Hamiltonian path space."""
    size = puzzle["size"]
    checkpoints = puzzle["checkpoints"]
    wall_set = build_wall_set(puzzle["walls"])
    order_by_key = {_key(cp["row"], cp["col"]): cp["order"] for cp in checkpoints}
    start = next(cp for cp in checkpoints if cp["order"] == 1)
    total = size * size
    visited = [[False] * size for _ in range(size)]
    trail: list[Coord] = []
    keep_going = True

    def dfs(cell: Coord, visited_count: int, next_expected: int) -> None:
        nonlocal keep_going
        if not keep_going:
            return
        if visited_count == total:
            keep_going = on_solution(trail)
            return
        for neighbour in _neighbours(cell, size):
            if visited[neighbour["row"]][neighbour["col"]] or not can_connect(
                wall_set, cell, neighbour
            ):
                continue
            order = order_by_key.get(_key(neighbour["row"], neighbour["col"]))
            if order is not None and order != next_expected:
                continue
            visited[neighbour["row"]][neighbour["col"]] = True
            trail.append(neighbour)
            dfs(
                neighbour,
                visited_count + 1,
                next_expected if order is None else next_expected + 1,
            )
            trail.pop()
            visited[neighbour["row"]][neighbour["col"]] = False
            if not keep_going:
                return

    visited[start["row"]][start["col"]] = True
    trail.append({"row": start["row"], "col": start["col"]})
    dfs(start, 1, 2)


def count_solutions(puzzle: Payload, limit: int = 2) -> int:
    """Count solutions of a Zip puzzle, short-circuiting at ``limit``."""
    count = 0

    def on_solution(_trail: list[Coord]) -> bool:
        nonlocal count
        count += 1
        return count < limit

    _search(puzzle, on_solution)
    return count


def solve_zip(puzzle: Payload) -> list[Coord] | None:
    """Return the first full solution path, or ``None``."""
    solution: list[Coord] | None = None

    def on_solution(trail: list[Coord]) -> bool:
        nonlocal solution
        solution = [dict(cell) for cell in trail]
        return False

    _search(puzzle, on_solution)
    return solution


def _generate_puzzle(seed: int) -> Payload:
    """Generate a Zip board with a unique solution."""
    rng = mulberry32(seed)
    path = _random_hamiltonian_path(rng)
    checkpoints = _choose_checkpoints(path, rng)

    path_edges = {
        _wall_key(path[i], path[i + 1]) for i in range(len(path) - 1)
    }

    candidates: list[dict] = []
    for row in range(SIZE):
        for col in range(SIZE):
            if col + 1 < SIZE:
                wall = {
                    "from": {"row": row, "col": col},
                    "to": {"row": row, "col": col + 1},
                }
                if _wall_key(wall["from"], wall["to"]) not in path_edges:
                    candidates.append(wall)
            if row + 1 < SIZE:
                wall = {
                    "from": {"row": row, "col": col},
                    "to": {"row": row + 1, "col": col},
                }
                if _wall_key(wall["from"], wall["to"]) not in path_edges:
                    candidates.append(wall)
    shuffle_in_place(candidates, rng)

    # Add walls (never on the solution path) until the solution is unique.
    walls: list[dict] = []
    nxt = 0
    while (
        nxt < len(candidates)
        and count_solutions(
            {"size": SIZE, "checkpoints": checkpoints, "walls": walls}, 2
        )
        > 1
    ):
        walls.append(candidates[nxt])
        nxt += 1

    # Drop any wall that isn't required for uniqueness.
    minimal = list(walls)
    for wall in walls:
        trial = [w for w in minimal if w is not wall]
        if (
            count_solutions(
                {"size": SIZE, "checkpoints": checkpoints, "walls": trial}, 2
            )
            == 1
        ):
            minimal = trial

    return {"size": SIZE, "checkpoints": checkpoints, "walls": minimal}


def _is_checkpoint_order_respected(
    path: list[Coord], checkpoints: list[dict]
) -> bool:
    """The path crosses every checkpoint in strictly ascending order."""
    order_by_key = {_key(cp["row"], cp["col"]): cp["order"] for cp in checkpoints}
    visited_orders = [
        order_by_key[_key(step["row"], step["col"])]
        for step in path
        if _key(step["row"], step["col"]) in order_by_key
    ]
    if len(visited_orders) != len(checkpoints):
        return False
    return all(
        index == 0 or value > visited_orders[index - 1]
        for index, value in enumerate(visited_orders)
    )


def validate(payload: Payload, solution: object) -> bool:
    """Whether ``solution`` (a full path of ``{row, col}``) solves the puzzle.

    Stricter than the client win check: it re-verifies the path is a single
    continuous walk that never crosses a wall or repeats a cell (anti-cheat).
    """
    if not isinstance(solution, list):
        return False
    size = payload["size"]
    if len(solution) != size * size:
        return False

    seen: set[tuple[int, int]] = set()
    path: list[Coord] = []
    for cell in solution:
        try:
            row, col = int(cell["row"]), int(cell["col"])
        except (KeyError, TypeError, ValueError):
            return False
        if not (0 <= row < size and 0 <= col < size) or (row, col) in seen:
            return False
        seen.add((row, col))
        path.append({"row": row, "col": col})

    wall_set = build_wall_set(payload["walls"])
    for i in range(len(path) - 1):
        if not can_connect(wall_set, path[i], path[i + 1]):
            return False
    return _is_checkpoint_order_respected(path, payload["checkpoints"])


def solve(payload: Payload) -> list[Coord] | None:
    """Return a valid solution for ``payload`` (used for reference and tests)."""
    return solve_zip(payload)


def generate(seed: int) -> GeneratedPuzzle:
    """Deterministically generate a Zip puzzle for ``seed``."""
    payload = _generate_puzzle(seed)
    return GeneratedPuzzle(payload=payload, solution=solve(payload))
