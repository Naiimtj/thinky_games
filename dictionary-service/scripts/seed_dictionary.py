#!/usr/bin/env python3
"""Drop and recreate the dictionary PostgreSQL database, then seed all languages.

Usage:
    uv run python scripts/seed_dictionary.py
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database.database import Base, engine

DB_HOST = os.getenv("DICTIONARY_DB_HOST", "localhost")
DB_PORT = os.getenv("DICTIONARY_DB_PORT", "5433")
DB_USER = os.getenv("DICTIONARY_DB_USER", "dict")
DB_PASSWORD = os.getenv("DICTIONARY_DB_PASSWORD", "dict")
DB_NAME = os.getenv("DICTIONARY_DB_NAME", "dictionary")
ADMIN_PASSWORD = os.getenv("DICTIONARY_ADMIN_PASSWORD", "thinky")
BASE_URL = os.getenv("DICTIONARY_BASE_URL", "http://127.0.0.1:8100")


def run_psql(args: list[str], check: bool = True) -> subprocess.CompletedProcess:
    env = {**os.environ, "PGPASSWORD": DB_PASSWORD}
    cmd = ["psql", "-h", DB_HOST, "-p", DB_PORT, "-U", DB_USER, *args]
    return subprocess.run(cmd, env=env, check=check, capture_output=True, text=True)


def recreate_database() -> None:
    """Drop and recreate the dictionary database."""
    print(f"Dropping database {DB_NAME} if it exists...")
    run_psql(["-c", f"DROP DATABASE IF EXISTS {DB_NAME};"], check=False)
    print(f"Creating database {DB_NAME}...")
    run_psql(["-c", f"CREATE DATABASE {DB_NAME};"])


def create_tables() -> None:
    print("Creating SQLAlchemy tables...")
    Base.metadata.create_all(bind=engine)


def import_language(lang: str, seed_file: Path) -> None:
    if not seed_file.exists():
        print(f"Seed file not found, skipping {lang}: {seed_file}")
        return
    print(f"Importing {lang} words from {seed_file}...")
    subprocess.run(
        [
            "curl", "-s", "-X", "POST",
            f"{BASE_URL}/words/{lang}/import",
            "-H", "Content-Type: application/json",
            "-H", f"X-Admin-Password: {ADMIN_PASSWORD}",
            "--data", f"@{seed_file}",
        ],
        check=True,
    )
    print()


def verify_counts() -> None:
    print("Final word counts:")
    for lang in ("es", "en", "de"):
        subprocess.run(
            ["curl", "-s", f"{BASE_URL}/words/{lang}/count"],
            check=False,
        )
        print()


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    recreate_database()
    create_tables()
    for lang in ("es", "en", "de"):
        import_language(lang, script_dir / f"{lang}_words_15k.json")
    verify_counts()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
