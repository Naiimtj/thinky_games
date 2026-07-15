"""Shared types describing a backend game and its generated puzzles."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable

Payload = dict[str, Any]


@dataclass(frozen=True)
class GeneratedPuzzle:
    """A generated puzzle split into a public payload and a private solution.

    ``payload`` is what the client receives (the board), while ``solution`` is a
    reference solution kept server-side for hints/inspection. Answer checking is
    done by ``GameSpec.validate`` against the puzzle rules, not by comparing to
    this reference, so any valid solution is accepted.
    """

    payload: Payload
    solution: Any


@dataclass(frozen=True)
class GameSpec:
    """Catalogue metadata plus the callables that power a single game."""

    id: str
    name: str
    tagline: str
    emoji: str
    playable: bool
    demo_seed: int
    generate: Callable[..., GeneratedPuzzle]
    validate: Callable[[Payload, Any], bool]
    solve: Callable[[Payload], Any]
    generate_daily: Callable[..., GeneratedPuzzle] | None = None
