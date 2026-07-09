"""Admin-only on-demand database backup/restore endpoints."""

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import require_admin_password
from app.core.database.backup import create_backup, list_backups, restore_backup
from app.core.schemas.status import BackupListResponse, BackupResponse

router = APIRouter(
    prefix="/db",
    tags=["backup"],
    dependencies=[Depends(require_admin_password)],
)


@router.post(
    "/backup",
    response_model=BackupResponse,
    summary="Crear un backup manual de la base de datos",
)
def backup_database() -> BackupResponse:
    result = create_backup()
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    return BackupResponse(**result)


@router.get(
    "/backup/list",
    response_model=BackupListResponse,
    summary="Listar todos los backups disponibles",
)
def backup_list() -> BackupListResponse:
    return BackupListResponse(status="ok", backups=list_backups())


@router.post(
    "/backup/restore",
    response_model=BackupResponse,
    summary="Restaurar un backup a partir de su ruta relativa (de /db/backup/list)",
)
def backup_restore(file: str) -> BackupResponse:
    result = restore_backup(file)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["message"])
    return BackupResponse(**result)
