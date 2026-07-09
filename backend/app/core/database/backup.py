"""On-demand database backup/restore via ``mysqldump``/``mysql``.

Used by the admin-only endpoints in ``app.routers.backup``. Files are stored
as gzip-compressed SQL dumps under ``settings.backup_data_dir`` (the same
volume the scheduled ``backup`` container writes its tiered backups to).
"""

import gzip
import logging
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from app.config.env import get_settings

logger = logging.getLogger("thinky-games")

settings = get_settings()
BACKUP_DIR = Path(settings.backup_data_dir)


def _mysql_conn_args() -> list[str]:
    """Common mysql/mysqldump connection arguments."""
    return [
        f"--host={settings.MYSQL_HOST}",
        f"--port={settings.MYSQL_PORT}",
        f"--user={settings.MYSQL_USER}",
        f"--password={settings.MYSQL_PASSWORD}",
        "--protocol=TCP",
        "--skip-ssl",
    ]


def create_backup() -> dict:
    """Run ``mysqldump`` and store a compressed ``.sql.gz`` file under ``manual/``."""
    manual_dir = BACKUP_DIR / "manual"
    manual_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"thinky_games_{stamp}.sql.gz"
    filepath = manual_dir / filename

    try:
        result = subprocess.run(
            [
                "mysqldump",
                *_mysql_conn_args(),
                "--single-transaction",
                "--quick",
                settings.MYSQL_DATABASE,
            ],
            capture_output=True,
            check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        message = exc.stderr.decode() if isinstance(exc, subprocess.CalledProcessError) else str(exc)
        logger.error("Backup failed: %s", message)
        return {"status": "error", "message": message}

    with gzip.open(filepath, "wb") as fh:
        fh.write(result.stdout)

    return {"status": "ok", "message": f"Backup created: {filename}"}


def list_backups() -> list[dict]:
    """Return metadata for every stored ``.sql.gz`` backup file."""
    if not BACKUP_DIR.exists():
        return []
    backups = []
    for path in BACKUP_DIR.rglob("*.sql.gz"):
        stat = path.stat()
        backups.append(
            {
                "path": str(path.relative_to(BACKUP_DIR)),
                "size_bytes": stat.st_size,
                "modified_at": datetime.fromtimestamp(
                    stat.st_mtime, tz=timezone.utc
                ).isoformat(),
            }
        )
    return sorted(backups, key=lambda b: b["modified_at"], reverse=True)


def restore_backup(relative_path: str) -> dict:
    """Restore the database from a previously created backup file."""
    filepath = (BACKUP_DIR / relative_path).resolve()
    if BACKUP_DIR.resolve() not in filepath.parents or not filepath.is_file():
        return {"status": "error", "message": "Backup file not found"}

    try:
        with gzip.open(filepath, "rb") as fh:
            sql_content = fh.read()
        subprocess.run(
            ["mysql", *_mysql_conn_args(), settings.MYSQL_DATABASE],
            input=sql_content,
            capture_output=True,
            check=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        message = exc.stderr.decode() if isinstance(exc, subprocess.CalledProcessError) else str(exc)
        logger.error("Restore failed: %s", message)
        return {"status": "error", "message": message}

    return {"status": "ok", "message": f"Restored from {relative_path}"}
