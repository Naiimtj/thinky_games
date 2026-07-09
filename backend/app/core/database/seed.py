"""Seed initial reference data (idempotent — safe to run multiple times).

Thinky Games has no static reference catalog to load yet. This hook exists
so future seed data can be added without touching ``main.py``'s startup
lifecycle.
"""

from sqlalchemy.orm import Session


def run_seed(db: Session) -> dict:
    """Run all seed steps. Currently a no-op; extend as needed."""
    return {"status": "ok", "details": "no seed data configured"}
