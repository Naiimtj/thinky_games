#!/usr/bin/env python3
"""Drop and recreate the dictionary PostgreSQL database, then seed all languages.

This script does NOT require the dictionary service to be running: it talks
 directly to the database and uses the same CRUD layer as the API.

Environment:
    DATABASE_URL        SQLAlchemy URL for the dictionary PostgreSQL database.
                        Falls back to the value defined in app.core.config.
                        Examples:
                        - local Docker: postgresql+psycopg2://dict:dict@localhost:5433/dictionary
                        - inside container: postgresql+psycopg2://dict:dict@dictionary-db:5432/dictionary
    DICTIONARY_SEEDS    Comma-separated list of languages to import (default: es,en,de).

Usage:
    uv run python scripts/seed_dictionary.py
    DATABASE_URL=postgresql+psycopg2://dict:dict@localhost:5433/dictionary uv run python scripts/seed_dictionary.py
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine, text

from app.core.config import get_settings
from app.core.crud import words as words_crud
from app.core.database.database import Base, SessionLocal, engine
from app.core.schemas.words import WordCreate


def _parse_db_url() -> dict[str, str]:
    """Return host, port, user, password and database from DATABASE_URL."""
    url = os.getenv("DATABASE_URL", get_settings().database_url)
    parsed = urlparse(url)
    return {
        "driver": parsed.scheme,
        "host": parsed.hostname or "localhost",
        "port": str(parsed.port or 5432),
        "user": parsed.username or "dict",
        "password": parsed.password or "dict",
        "database": parsed.path.lstrip("/") or "dictionary",
    }


def _admin_database_url(parts: dict[str, str]) -> str:
    """Return a URL pointing to the 'postgres' maintenance database."""
    return (
        f"{parts['driver']}://{parts['user']}:{parts['password']}"
        f"@{parts['host']}:{parts['port']}/postgres"
    )


def _run_psql(
    parts: dict[str, str],
    args: list[str],
    *,
    database: str = "postgres",
    check: bool = True,
) -> subprocess.CompletedProcess:
    env = {**os.environ, "PGPASSWORD": parts["password"]}
    cmd = [
        "psql",
        "-h", parts["host"],
        "-p", parts["port"],
        "-U", parts["user"],
        "-d", database,
        *args,
    ]
    return subprocess.run(cmd, env=env, check=check, capture_output=True, text=True)


def _psql_available() -> bool:
    return subprocess.run(
        ["which", "psql"], capture_output=True, text=True
    ).returncode == 0


def recreate_database(parts: dict[str, str]) -> None:
    """Drop and recreate the dictionary database."""
    db_name = parts["database"]
    print(f"Dropping database {db_name} if it exists...")
    print(f"Creating database {db_name}...")

    if _psql_available():
        _run_psql(
            parts,
            ["-c", f"DROP DATABASE IF EXISTS {db_name} WITH (FORCE);"],
            check=False,
        )
        _run_psql(parts, ["-c", f"CREATE DATABASE {db_name};"])
        return

    # Fallback when psql is not installed (e.g. inside a slim container).
    admin_engine = create_engine(
        _admin_database_url(parts),
        isolation_level="AUTOCOMMIT",
    )
    try:
        with admin_engine.connect() as conn:
            conn.execute(text(f"DROP DATABASE IF EXISTS {db_name} WITH (FORCE)"))
            conn.execute(text(f"CREATE DATABASE {db_name}"))
    finally:
        admin_engine.dispose()


def create_tables() -> None:
    print("Creating SQLAlchemy tables...")
    Base.metadata.create_all(bind=engine)


def import_language(lang: str, seed_file: Path) -> None:
    if not seed_file.exists():
        print(f"Seed file not found, skipping {lang}: {seed_file}")
        return

    print(f"Importing {lang} words from {seed_file}...")
    with seed_file.open(encoding="utf-8") as fh:
        raw_entries = json.load(fh)

    payloads = [WordCreate(**entry) for entry in raw_entries]
    db = SessionLocal()
    try:
        inserted = words_crud.bulk_create_words(db, lang, payloads)
        print(f"  {lang}: inserted {inserted}/{len(payloads)} words")
    finally:
        db.close()


def verify_counts() -> None:
    print("Final word counts:")
    db = SessionLocal()
    try:
        counts = words_crud.count_words(db)
        for lang, count in counts.items():
            print(f"  {lang}: {count}")
    finally:
        db.close()


def main() -> int:
    script_dir = Path(__file__).resolve().parent
    parts = _parse_db_url()
    languages = os.getenv("DICTIONARY_SEEDS", "es,en,de").split(",")

    recreate_database(parts)
    create_tables()
    for lang in languages:
        lang = lang.strip()
        if not lang:
            continue
        import_language(lang, script_dir / f"{lang}_words_15k.json")
    verify_counts()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
