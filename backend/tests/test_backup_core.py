"""Unit tests for backup core commands and file flow."""

import gzip
from pathlib import Path
from types import SimpleNamespace

from app.core.database import backup


def test_create_backup_runs_mysqldump_without_skip_ssl(monkeypatch, tmp_path):
    monkeypatch.setattr(backup, "BACKUP_DIR", tmp_path)

    captured = {}

    def _fake_run(command, capture_output, check):
        captured["command"] = command
        assert capture_output is True
        assert check is True
        return SimpleNamespace(stdout=b"-- fake sql dump --")

    monkeypatch.setattr(backup.subprocess, "run", _fake_run)

    result = backup.create_backup()

    assert result["status"] == "ok"
    command = captured["command"]
    assert command[0] == "mysqldump"
    assert "--skip-ssl" not in command
    created_files = list((tmp_path / "manual").glob("*.sql.gz"))
    assert len(created_files) == 1


def test_restore_backup_runs_mysql_without_skip_ssl(monkeypatch, tmp_path):
    monkeypatch.setattr(backup, "BACKUP_DIR", tmp_path)

    manual_dir = tmp_path / "manual"
    manual_dir.mkdir(parents=True, exist_ok=True)
    dump_path = manual_dir / "sample.sql.gz"
    with gzip.open(dump_path, "wb") as fh:
        fh.write(b"CREATE TABLE test(id INT);")

    captured = {}

    def _fake_run(command, input, capture_output, check):
        captured["command"] = command
        captured["input"] = input
        assert capture_output is True
        assert check is True
        return SimpleNamespace(stdout=b"", stderr=b"")

    monkeypatch.setattr(backup.subprocess, "run", _fake_run)

    result = backup.restore_backup("manual/sample.sql.gz")

    assert result["status"] == "ok"
    command = captured["command"]
    assert command[0] == "mysql"
    assert "--skip-ssl" not in command
    assert captured["input"] == b"CREATE TABLE test(id INT);"
