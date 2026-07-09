"""Queens puzzle: generator, solver and validator (ported from the frontend).

Picks a random valid queen placement (one per row/column, none touching), then
grows contiguous colour regions around each queen so the resulting board has a
single valid solution. Everything is deterministic from a seed.
"""

from __future__ import annotations

from app.core.games.base import GeneratedPuzzle, Payload
from app.core.games.prng import Rng, mulberry32, rand_int, shuffle_in_place

SIZE = 8
DEMO_SEED = 1
MAX_ATTEMPTS = 500
REPAIR_STEPS = 300
ORTHOGONAL = ((-1, 0), (1, 0), (0, -1), (0, 1))

Cell = tuple[int, int]


def _in_bounds(row: int, col: int) -> bool:
    return 0 <= row < SIZE and 0 <= col < SIZE


def _random_solution(rng: Rng) -> list[int] | None:
    """A random valid solution as column-per-row; consecutive rows differ by >=2."""
    cols = [0] * SIZE
    used_col: set[int] = set()

    def place(row: int) -> bool:
        if row == SIZE:
            return True
        for col in shuffle_in_place(list(range(SIZE)), rng):
            if col in used_col:
                continue
            if row > 0 and abs(col - cols[row - 1]) < 2:
                continue
            cols[row] = col
            used_col.add(col)
            if place(row + 1):
                return True
            used_col.discard(col)
        return False

    return list(cols) if place(0) else None


def _grow_regions(rng: Rng, cols: list[int]) -> list[list[int]]:
    """Grow one compact region per queen using balanced round-robin expansion."""
    regions = [[-1] * SIZE for _ in range(SIZE)]
    frontier: list[list[Cell]] = [[] for _ in range(SIZE)]

    def claim(row: int, col: int, region_id: int) -> None:
        regions[row][col] = region_id
        for dr, dc in ORTHOGONAL:
            nr, nc = row + dr, col + dc
            if _in_bounds(nr, nc) and regions[nr][nc] == -1:
                frontier[region_id].append((nr, nc))

    for row, col in enumerate(cols):
        claim(row, col, row)

    remaining = SIZE * SIZE - SIZE
    while remaining > 0:
        for region_id in shuffle_in_place(list(range(SIZE)), rng):
            cells = frontier[region_id]
            while cells:
                row, col = cells.pop(rand_int(rng, len(cells)))
                if regions[row][col] == -1:
                    claim(row, col, region_id)
                    remaining -= 1
                    break
            if remaining == 0:
                break

    return regions


def _find_solutions(
    regions: list[list[int]], size: int, limit: int = 2
) -> list[list[int]]:
    """Collect up to ``limit`` valid solutions (each as column-per-row)."""
    cols = [0] * size
    used_col: set[int] = set()
    used_region: set[int] = set()
    solutions: list[list[int]] = []

    def place(row: int) -> None:
        if len(solutions) >= limit:
            return
        if row == size:
            solutions.append(list(cols))
            return
        for col in range(size):
            if col in used_col:
                continue
            if row > 0 and abs(col - cols[row - 1]) < 2:
                continue
            region = regions[row][col]
            if region in used_region:
                continue
            cols[row] = col
            used_col.add(col)
            used_region.add(region)
            place(row + 1)
            used_col.discard(col)
            used_region.discard(region)
            if len(solutions) >= limit:
                return

    place(0)
    return solutions


def count_solutions(regions: list[list[int]], size: int, limit: int = 2) -> int:
    """Count valid solutions of a regions board, short-circuiting at ``limit``."""
    return len(_find_solutions(regions, size, limit))


def _same_cols(a: list[int], b: list[int]) -> bool:
    return all(a[row] == b[row] for row in range(len(a)))


def _region_stays_contiguous(
    regions: list[list[int]], region_id: int, cell: Cell
) -> bool:
    """True if region ``region_id`` stays one connected blob without ``cell``."""
    cells = [
        (row, col)
        for row in range(SIZE)
        for col in range(SIZE)
        if regions[row][col] == region_id and (row, col) != cell
    ]
    if not cells:
        return False
    seen = {cells[0]}
    stack = [cells[0]]
    while stack:
        row, col = stack.pop()
        for dr, dc in ORTHOGONAL:
            nr, nc = row + dr, col + dc
            if (
                _in_bounds(nr, nc)
                and regions[nr][nc] == region_id
                and (nr, nc) != cell
                and (nr, nc) not in seen
            ):
                seen.add((nr, nc))
                stack.append((nr, nc))
    return len(seen) == len(cells)


def _break_alternate(
    regions: list[list[int]], intended: list[int], alt: list[int], rng: Rng
) -> bool:
    """Move one alternate-solution queen cell into a neighbouring region."""
    diff_rows = shuffle_in_place(
        [row for row in range(SIZE) if alt[row] != intended[row]], rng
    )
    for row in diff_rows:
        cell = (row, alt[row])
        current_region = regions[cell[0]][cell[1]]
        if not _region_stays_contiguous(regions, current_region, cell):
            continue
        targets = [
            regions[r][c]
            for dr, dc in ORTHOGONAL
            for r, c in [(cell[0] + dr, cell[1] + dc)]
            if _in_bounds(r, c) and regions[r][c] != current_region
        ]
        if not targets:
            continue
        regions[cell[0]][cell[1]] = targets[rand_int(rng, len(targets))]
        return True
    return False


def _generate_puzzle(seed: int) -> Payload:
    """Generate a Queens board with (ideally) a unique solution."""
    rng = mulberry32(seed)
    last_regions: list[list[int]] | None = None

    for _ in range(MAX_ATTEMPTS):
        intended = _random_solution(rng)
        if intended is None:
            continue
        regions = _grow_regions(rng, intended)
        last_regions = regions

        for _ in range(REPAIR_STEPS):
            solutions = _find_solutions(regions, SIZE, 2)
            if len(solutions) == 1:
                return {"size": SIZE, "regions": regions}
            alt = next((s for s in solutions if not _same_cols(s, intended)), None)
            if alt is None or not _break_alternate(regions, intended, alt, rng):
                break

    return {"size": SIZE, "regions": last_regions}


def _solve(regions: list[list[int]], size: int) -> list[dict[str, int]] | None:
    """Solve the puzzle, returning one queen ``{row, col}`` per row."""
    cols = [0] * size
    used_col: set[int] = set()
    used_region: set[int] = set()

    def place(row: int) -> bool:
        if row == size:
            return True
        for col in range(size):
            if col in used_col:
                continue
            if row > 0 and abs(col - cols[row - 1]) < 2:
                continue
            region = regions[row][col]
            if region in used_region:
                continue
            cols[row] = col
            used_col.add(col)
            used_region.add(region)
            if place(row + 1):
                return True
            used_col.discard(col)
            used_region.discard(region)
        return False

    if place(0):
        return [{"row": row, "col": cols[row]} for row in range(size)]
    return None


def _are_touching(a: Cell, b: Cell) -> bool:
    return abs(a[0] - b[0]) <= 1 and abs(a[1] - b[1]) <= 1


def is_queens_solved(queens: list[Cell], regions: list[list[int]], size: int) -> bool:
    """One queen per row, column and colour region, and none touching."""
    if len(queens) != size:
        return False

    rows: set[int] = set()
    cols: set[int] = set()
    region_ids: set[int] = set()
    for row, col in queens:
        if not (0 <= row < size and 0 <= col < size):
            return False
        rows.add(row)
        cols.add(col)
        region_ids.add(regions[row][col])
    if len(rows) != size or len(cols) != size or len(region_ids) != size:
        return False

    for i in range(len(queens)):
        for j in range(i + 1, len(queens)):
            if _are_touching(queens[i], queens[j]):
                return False
    return True


def validate(payload: Payload, solution: object) -> bool:
    """Whether ``solution`` (a list of ``{row, col}``) solves the puzzle."""
    if not isinstance(solution, list):
        return False
    try:
        queens = [(int(item["row"]), int(item["col"])) for item in solution]
    except (KeyError, TypeError, ValueError):
        return False
    return is_queens_solved(queens, payload["regions"], payload["size"])


def solve(payload: Payload) -> list[dict[str, int]] | None:
    """Return a valid solution for ``payload`` (used for reference and tests)."""
    return _solve(payload["regions"], payload["size"])


def generate(seed: int) -> GeneratedPuzzle:
    """Deterministically generate a Queens puzzle for ``seed``."""
    payload = _generate_puzzle(seed)
    return GeneratedPuzzle(payload=payload, solution=solve(payload))
