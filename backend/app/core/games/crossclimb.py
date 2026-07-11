"""Crossclimb: word-ladder puzzle (ported from the frontend).

Generates a chain of seven Spanish words (4 or 5 letters) where each consecutive
pair differs by one letter (top + five rungs + bottom), and enriches each word
with a real RAE definition as its clue.

When a rae-api.com key is configured (``RAE_KEY``), clues are fetched server-side
for a freshly generated chain. If no key is set, or the dictionary can't supply
a clue for every word, it falls back to a curated pool so Crossclimb is always
available.

Words used in the last ``RECENT_WINDOW_DAYS`` are avoided so the same word
doesn't reappear too soon; if no valid chain can be built without repeats, a
chain that repeats is used rather than leaving the puzzle ungenerated.
"""

from __future__ import annotations

from datetime import timedelta

from app.config.env import get_settings
from app.core.games.base import GeneratedPuzzle, Payload
from app.core.games.daily import utc_today
from app.core.games.prng import mulberry32, rand_int, shuffle_in_place
from app.core.games.rae import fetch_clue
from app.core.games.words import words_by_length

DEMO_SEED = 1
LENGTHS = (4, 5)  # word lengths eligible for the ladder (dataset also has 3, kept out: too short)
CHAIN_LENGTH = 7  # top + 5 rungs + bottom
MAX_STEPS = 20000  # cap the ladder DFS so generation always terminates
MAX_DYNAMIC_ATTEMPTS = 12  # seeds tried to find a fully-clued chain before pool
RECENT_WINDOW_DAYS = 90  # avoid reusing a word if it appeared in the last N days

# The middle rungs form a one-letter word ladder; the top and bottom caps each
# differ by one letter from the adjacent end rung. Stored in solved order.
CROSSCLIMB_PUZZLES: list[dict] = [
    {
        "length": 4,
        "rungs": [
            {"word": "MESA", "clue": "Mueble con patas para comer"},
            {"word": "MASA", "clue": "Mezcla de harina y agua"},
            {"word": "CASA", "clue": "Lugar donde vives"},
            {"word": "CASO", "clue": "Asunto o situación que se investiga"},
            {"word": "PASO", "clue": "Movimiento al caminar"},
        ],
        "top": {"word": "MISA", "clue": "Celebración religiosa católica"},
        "bottom": {"word": "PISO", "clue": "Suelo o apartamento"},
    },
    {
        "length": 4,
        "rungs": [
            {"word": "GATO", "clue": "Felino doméstico"},
            {"word": "PATO", "clue": "Ave que nada y hace “cuac”"},
            {"word": "PATA", "clue": "Pierna de un animal"},
            {"word": "RATA", "clue": "Roedor de cola larga"},
            {"word": "RANA", "clue": "Anfibio que croa y salta"},
        ],
        "top": {"word": "GATA", "clue": "Felino doméstico (hembra)"},
        "bottom": {"word": "RAMA", "clue": "Parte del árbol que nace del tronco"},
    },
    {
        "length": 4,
        "rungs": [
            {"word": "SOPA", "clue": "Plato líquido que se toma con cuchara"},
            {"word": "ROPA", "clue": "Prendas de vestir"},
            {"word": "ROSA", "clue": "Flor con espinas"},
            {"word": "RASA", "clue": "Plana o lisa (femenino)"},
            {"word": "CASA", "clue": "Lugar donde vives"},
        ],
        "top": {"word": "COPA", "clue": "Vaso con pie para vino"},
        "bottom": {"word": "CAMA", "clue": "Mueble para dormir"},
    },
]


def _differs_by_one(a: str, b: str) -> bool:
    if len(a) != len(b):
        return False
    return sum(1 for x, y in zip(a, b) if x != y) == 1


def is_valid_ladder(words: list[str]) -> bool:
    """True when every consecutive pair of words differs by exactly one letter."""
    return all(
        index == 0 or _differs_by_one(words[index - 1], word)
        for index, word in enumerate(words)
    )


def _neighbours(word: str, words: list[str], cache: dict[str, list[str]]) -> list[str]:
    """Words differing from ``word`` in exactly one position (memoised)."""
    if word not in cache:
        cache[word] = [w for w in words if w != word and _differs_by_one(w, word)]
    return cache[word]


def _find_chain(
    rng, length: int, exclude: set[str] | None = None
) -> list[str] | None:
    """Depth-first search for a simple one-letter chain of CHAIN_LENGTH words.

    Words in ``exclude`` (already used recently) are skipped when there are
    still enough candidates left to build a full chain; otherwise the full
    pool is used so generation never fails just to avoid a repeat.
    """
    all_words = words_by_length()[length]
    words = (
        [w for w in all_words if w.upper() not in exclude] if exclude else all_words
    )
    if len(words) < CHAIN_LENGTH:
        words = all_words
    cache: dict[str, list[str]] = {}
    for start in shuffle_in_place(list(words), rng):
        path = [start]
        used = {start}
        steps = 0

        def extend() -> bool:
            nonlocal steps
            steps += 1
            if steps > MAX_STEPS:
                return False
            if len(path) == CHAIN_LENGTH:
                return True
            candidates = shuffle_in_place(
                [w for w in _neighbours(path[-1], words, cache) if w not in used],
                rng,
            )
            for nxt in candidates:
                path.append(nxt)
                used.add(nxt)
                if extend():
                    return True
                path.pop()
                used.discard(nxt)
            return False

        if extend():
            return path
    return None


def _generate_words(seed: int, exclude: set[str] | None = None) -> dict | None:
    """Deterministically build an uppercased word chain, or ``None``.

    Length is picked deterministically from ``LENGTHS`` using ``seed``; the
    chain search itself uses ``seed + 1`` so both draws are independent and
    each can be reset on retry. Falls back to allowing repeats if no chain
    can be found while excluding recently used words.
    """
    length = LENGTHS[rand_int(mulberry32(seed), len(LENGTHS))]
    chain = _find_chain(mulberry32(seed + 1), length, exclude)
    if chain is None and exclude:
        chain = _find_chain(mulberry32(seed + 1), length, None)
    if chain is None:
        return None
    upper = [word.upper() for word in chain]
    return {"length": length, "top": upper[0], "rungs": upper[1:6], "bottom": upper[6]}


def _build_dynamic(
    seed: int, api_key: str, exclude: set[str] | None = None
) -> Payload | None:
    """Generate a chain and enrich it with RAE clues, or ``None`` if unavailable."""
    for attempt in range(MAX_DYNAMIC_ATTEMPTS):
        words = _generate_words(seed + attempt, exclude)
        if words is None:
            continue
        chain = [words["top"], *words["rungs"], words["bottom"]]
        clues: list[str] = []
        for word in chain:
            clue = fetch_clue(word, api_key)
            if clue is None:  # short-circuit: skip this chain on the first miss
                break
            clues.append(clue)
        if len(clues) == len(chain):
            return {
                "length": words["length"],
                "top": {"word": words["top"], "clue": clues[0]},
                "rungs": [
                    {"word": word, "clue": clues[index + 1]}
                    for index, word in enumerate(words["rungs"])
                ],
                "bottom": {"word": words["bottom"], "clue": clues[6]},
            }
    return None


def _from_pool(seed: int) -> Payload:
    puzzle = CROSSCLIMB_PUZZLES[seed % len(CROSSCLIMB_PUZZLES)]
    return {
        "length": puzzle["length"],
        "top": dict(puzzle["top"]),
        "rungs": [dict(rung) for rung in puzzle["rungs"]],
        "bottom": dict(puzzle["bottom"]),
    }


def _generate_puzzle(seed: int, exclude: set[str] | None = None) -> Payload:
    api_key = get_settings().rae_key
    if api_key:
        dynamic = _build_dynamic(seed, api_key, exclude)
        if dynamic is not None:
            return dynamic
    return _from_pool(seed)


def _recent_used_words() -> set[str]:
    """Words used by any Crossclimb puzzle in the last ``RECENT_WINDOW_DAYS``.

    Best-effort: returns an empty set (no exclusion) if the lookup fails, so a
    transient DB issue never blocks puzzle generation.
    """
    from app.core.database.database import SessionLocal
    from app.core.database.models import DailyPuzzle

    cutoff = utc_today() - timedelta(days=RECENT_WINDOW_DAYS)
    db = SessionLocal()
    try:
        rows = (
            db.query(DailyPuzzle.payload)
            .filter(
                DailyPuzzle.game_type == "crossclimb",
                DailyPuzzle.puzzle_date >= cutoff,
            )
            .all()
        )
    except Exception:  # pragma: no cover - defensive: never block generation
        return set()
    finally:
        db.close()

    used: set[str] = set()
    for (payload,) in rows:
        used.add(payload["top"]["word"])
        used.add(payload["bottom"]["word"])
        for rung in payload["rungs"]:
            used.add(rung["word"])
    return used


def validate(payload: Payload, solution: object) -> bool:
    """Whether ``solution`` (words top→bottom) is the puzzle's valid ladder."""
    if not isinstance(solution, list) or not all(
        isinstance(word, str) for word in solution
    ):
        return False
    top = payload["top"]["word"]
    bottom = payload["bottom"]["word"]
    rung_words = [rung["word"] for rung in payload["rungs"]]
    if len(solution) != len(rung_words) + 2:
        return False
    if solution[0] != top or solution[-1] != bottom:
        return False
    if sorted(solution[1:-1]) != sorted(rung_words):
        return False
    return is_valid_ladder(solution)


def solve(payload: Payload) -> list[str]:
    """Return the correct ladder order (top, rungs..., bottom)."""
    return [
        payload["top"]["word"],
        *[rung["word"] for rung in payload["rungs"]],
        payload["bottom"]["word"],
    ]


def generate(seed: int) -> GeneratedPuzzle:
    """Build a Crossclimb puzzle for ``seed``, avoiding recently used words."""
    exclude = _recent_used_words()
    payload = _generate_puzzle(seed, exclude)
    return GeneratedPuzzle(payload=payload, solution=solve(payload))
