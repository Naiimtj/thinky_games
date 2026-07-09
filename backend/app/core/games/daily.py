"""Deterministic daily puzzle seeding (ported from ``games/dailySelection.js``).

Combines the year and day-of-year so generated daily puzzles are identical for
everyone that day, change each day, and don't repeat on the same calendar day
across years.
"""

from __future__ import annotations

from datetime import date, datetime, timezone


def utc_today() -> date:
    """Current calendar date in UTC."""
    return datetime.now(timezone.utc).date()


def day_of_year(target: date) -> int:
    """1-based day index within the year (matches the frontend ``dayOfYear``)."""
    return target.timetuple().tm_yday


def daily_seed(target: date) -> int:
    """Deterministic per-day seed shared by all players (``year*1000 + day``)."""
    return target.year * 1000 + day_of_year(target)
