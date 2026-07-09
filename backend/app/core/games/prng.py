"""Seeded PRNG ported from the frontend (``utils/prng.js``).

Kept bit-for-bit compatible with the JavaScript ``mulberry32`` implementation so
a given seed produces the same puzzle the client used to generate. Given the
same seed it always yields the same sequence, which is what makes the daily
puzzles identical for every player on a given day.
"""

from __future__ import annotations

from typing import Callable

_UINT32 = 0xFFFFFFFF

Rng = Callable[[], float]


def _imul(a: int, b: int) -> int:
    """Lower-32-bit integer multiply, matching JavaScript's ``Math.imul``."""
    return ((a & _UINT32) * (b & _UINT32)) & _UINT32


def mulberry32(seed: int) -> Rng:
    """Return a deterministic RNG producing floats in ``[0, 1)`` for ``seed``."""
    state = seed & _UINT32

    def rng() -> float:
        nonlocal state
        state = (state + 0x6D2B79F5) & _UINT32
        t = state
        t = _imul(t ^ (t >> 15), t | 1)
        t = ((t + _imul(t ^ (t >> 7), t | 61)) & _UINT32) ^ t
        return ((t ^ (t >> 14)) & _UINT32) / 4294967296.0

    return rng


def rand_int(rng: Rng, max_exclusive: int) -> int:
    """Random integer in ``[0, max_exclusive)`` (matches ``Math.floor(rng()*max)``)."""
    return int(rng() * max_exclusive)


def shuffle_in_place(array: list, rng: Rng) -> list:
    """In-place Fisher-Yates shuffle driven by ``rng``; returns the same list."""
    for i in range(len(array) - 1, 0, -1):
        j = rand_int(rng, i + 1)
        array[i], array[j] = array[j], array[i]
    return array
