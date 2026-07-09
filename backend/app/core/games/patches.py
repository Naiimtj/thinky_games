"""Patches: tile the board with clued figures (ported from the frontend).

Tiles the board with random rectangles (anchored at the first free cell so
coverage is always complete), turns each into a clued figure (shape + exact
size + colour), and keeps only partitions whose clues admit a single tiling.
Deterministic from a seed.
"""

from __future__ import annotations

from app.core.games.base import GeneratedPuzzle, Payload
from app.core.games.prng import mulberry32, rand_int

ROWS = 7
COLS = 7
MAX_SIDE = 3
MIN_SEEDS = 7
MIN_PATCH_SIZE = 2  # every patch must span at least this many cells (never 1x1)
MAX_ATTEMPTS = 400
DEMO_SEED = 1

PALETTE = [
    "#C49000", "#EF6C00", "#0097A7", "#00A651", "#7C4DFF",
    "#E40101", "#00AFFF", "#546E7A", "#D81B60", "#5D4037",
    "#3949AB", "#43A047", "#8E24AA", "#F4511E", "#1E88E5",
]
_ORTHO = ((1, 0), (-1, 0), (0, 1), (0, -1))


def _shape_of(height: int, width: int) -> str:
    if height == width:
        return "SQUARE"
    return "HRECT" if width > height else "VRECT"


def _free_width(owner: list[list[int]], row: int, col: int) -> int:
    """Count contiguous free cells to the right, starting at ``(row, col)``."""
    width = 0
    while col + width < COLS and owner[row][col + width] == -1:
        width += 1
    return width


def _free_height(owner: list[list[int]], row: int, col: int, width: int) -> int:
    """Count rows that are free across all ``width`` columns from ``(row, col)``."""
    height = 0
    while row + height < ROWS and all(
        owner[row + height][c] == -1 for c in range(col, col + width)
    ):
        height += 1
    return height


def _pick_region_dims(owner, row, col, rng) -> tuple[int, int]:
    """Pick a rectangle anchored at ``(row, col)`` that always spans >= 2 cells.

    A figure must never be a 1x1: if a single column can't grow downward, it is
    widened instead so the region's area is always at least ``MIN_PATCH_SIZE``.
    """
    width_limit = min(_free_width(owner, row, col), MAX_SIDE)
    width = 1 + rand_int(rng, width_limit)
    height_limit = min(_free_height(owner, row, col, width), MAX_SIDE)

    if width == 1 and height_limit < 2 and width_limit >= 2:
        width = 2 + rand_int(rng, width_limit - 1)
        height_limit = min(_free_height(owner, row, col, width), MAX_SIDE)

    if width == 1 and height_limit >= 2:
        height = 2 + rand_int(rng, height_limit - 1)
    else:
        height = 1 + rand_int(rng, height_limit)
    return width, height


def _random_partition(rng):
    owner = [[-1] * COLS for _ in range(ROWS)]
    regions: list[dict] = []

    def first_free():
        for row in range(ROWS):
            for col in range(COLS):
                if owner[row][col] == -1:
                    return row, col
        return None

    cell = first_free()
    while cell:
        row, col = cell
        width, height = _pick_region_dims(owner, row, col, rng)
        index = len(regions)
        for r in range(row, row + height):
            for c in range(col, col + width):
                owner[r][c] = index
        regions.append({"row": row, "col": col, "height": height, "width": width})
        cell = first_free()

    return owner, regions


def _build_seeds(regions: list[dict], rng) -> list[dict]:
    return [
        {
            "row": region["row"] + rand_int(rng, region["height"]),
            "col": region["col"] + rand_int(rng, region["width"]),
            "color": PALETTE[index % len(PALETTE)],
            "shape": _shape_of(region["height"], region["width"]),
            "size": region["height"] * region["width"],
        }
        for index, region in enumerate(regions)
    ]


def _rectangle_dims(area: int, shape: str) -> list[tuple[int, int]]:
    dims = []
    for height in range(1, area + 1):
        if area % height != 0:
            continue
        width = area // height
        if shape == "SQUARE":
            allowed = height == width
        elif shape == "HRECT":
            allowed = width > height
        else:  # VRECT
            allowed = height > width
        if allowed:
            dims.append((height, width))
    return dims


def _candidates_for(seed: dict, rows: int, cols: int) -> list[dict]:
    placements = []
    for height, width in _rectangle_dims(seed["size"], seed["shape"]):
        for r0 in range(seed["row"] - height + 1, seed["row"] + 1):
            for c0 in range(seed["col"] - width + 1, seed["col"] + 1):
                if r0 < 0 or c0 < 0 or r0 + height > rows or c0 + width > cols:
                    continue
                placements.append(
                    {"r0": r0, "c0": c0, "height": height, "width": width}
                )
    return placements


def count_tilings(seeds: list[dict], rows: int, cols: int, limit: int = 2) -> int:
    """Count valid tilings for the seed clues, short-circuiting at ``limit``."""
    used = [[False] * cols for _ in range(rows)]
    candidates = [_candidates_for(seed, rows, cols) for seed in seeds]
    count = 0

    def fits(rect: dict) -> bool:
        for r in range(rect["r0"], rect["r0"] + rect["height"]):
            for c in range(rect["c0"], rect["c0"] + rect["width"]):
                if used[r][c]:
                    return False
        return True

    def paint(rect: dict, value: bool) -> None:
        for r in range(rect["r0"], rect["r0"] + rect["height"]):
            for c in range(rect["c0"], rect["c0"] + rect["width"]):
                used[r][c] = value

    def place(index: int) -> None:
        nonlocal count
        if count >= limit:
            return
        if index == len(seeds):
            count += 1  # areas sum to the board, so a full placement covers it
            return
        for rect in candidates[index]:
            if not fits(rect):
                continue
            paint(rect, True)
            place(index + 1)
            paint(rect, False)
            if count >= limit:
                return

    place(0)
    return count


def _generate_puzzle(seed: int) -> Payload:
    rng = mulberry32(seed)
    last: Payload | None = None

    for _ in range(MAX_ATTEMPTS):
        owner, regions = _random_partition(rng)
        seeds = _build_seeds(regions, rng)
        if any(seed["size"] < MIN_PATCH_SIZE for seed in seeds):
            continue  # every patch must span at least MIN_PATCH_SIZE cells
        candidate: Payload = {
            "rows": ROWS,
            "cols": COLS,
            "seeds": seeds,
            "solution": owner,
        }
        last = candidate  # remember the most recent partition with no tiny patch
        if len(seeds) >= MIN_SEEDS and count_tilings(seeds, ROWS, COLS, 2) == 1:
            return candidate

    return last


# --- Validation (rule-based: the drawn tiling must match the clues) ---------


def _cell_key(row: int, col: int) -> str:
    return f"{row},{col}"


def _is_contiguous(cells: list[tuple[int, int]]) -> bool:
    cell_set = set(cells)
    seen = {cells[0]}
    stack = [cells[0]]
    while stack:
        row, col = stack.pop()
        for dr, dc in _ORTHO:
            neighbour = (row + dr, col + dc)
            if neighbour in cell_set and neighbour not in seen:
                seen.add(neighbour)
                stack.append(neighbour)
    return len(seen) == len(cells)


def _figure_matches(cells: list[tuple[int, int]], shape: str, size: int | None) -> bool:
    if not cells:
        return False
    if size is not None and len(cells) != size:
        return False
    if not _is_contiguous(cells):
        return False
    rows = [cell[0] for cell in cells]
    cols = [cell[1] for cell in cells]
    height = max(rows) - min(rows) + 1
    width = max(cols) - min(cols) + 1
    is_solid_rect = len(cells) == width * height
    if shape == "SQUARE":
        return is_solid_rect and width == height
    if shape == "HRECT":
        return is_solid_rect and width > height
    if shape == "VRECT":
        return is_solid_rect and height > width
    return True  # ANY


def is_patches_solved(owner: dict, seeds: list[dict], rows: int, cols: int) -> bool:
    for row in range(rows):
        for col in range(cols):
            if _cell_key(row, col) not in owner:
                return False
    for index, seed in enumerate(seeds):
        cells = [
            (int(key.split(",")[0]), int(key.split(",")[1]))
            for key, value in owner.items()
            if value == index
        ]
        contains_seed = any(
            row == seed["row"] and col == seed["col"] for row, col in cells
        )
        if not (contains_seed and _figure_matches(cells, seed["shape"], seed["size"])):
            return False
    return True


def validate(payload: Payload, solution: object) -> bool:
    """Whether the submitted owner map (``{"r,c": seedIndex}``) tiles the board."""
    if not isinstance(solution, dict):
        return False
    rows, cols, seeds = payload["rows"], payload["cols"], payload["seeds"]
    owner: dict[str, int] = {}
    for key, value in solution.items():
        if not isinstance(key, str):
            return False
        parts = key.split(",")
        if len(parts) != 2:
            return False
        try:
            row, col = int(parts[0]), int(parts[1])
        except ValueError:
            return False
        if not (0 <= row < rows and 0 <= col < cols):
            return False
        if type(value) is not int or not (0 <= value < len(seeds)):
            return False
        owner[key] = value
    return is_patches_solved(owner, seeds, rows, cols)


def solve(payload: Payload) -> dict[str, int]:
    """Return the reference tiling as an owner map (``{"r,c": seedIndex}``)."""
    solution = payload["solution"]
    return {
        _cell_key(row, col): solution[row][col]
        for row in range(payload["rows"])
        for col in range(payload["cols"])
    }


def generate(seed: int) -> GeneratedPuzzle:
    """Deterministically generate a Patches puzzle for ``seed``."""
    payload = _generate_puzzle(seed)
    return GeneratedPuzzle(payload=payload, solution=payload["solution"])
