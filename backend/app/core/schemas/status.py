"""Operational/status schemas (health, backups)."""

from pydantic import BaseModel


class BackupResponse(BaseModel):
    status: str
    message: str


class BackupListResponse(BaseModel):
    status: str
    backups: list[dict]
