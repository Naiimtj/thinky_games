#!/bin/sh
# Create one compressed database dump for a retention tier, then prune that
# tier so only the newest N dumps survive (oldest are deleted automatically).
#
# Usage: run_backup.sh <tier> <keep>
#   e.g. run_backup.sh daily 5
set -eu

ENV_FILE="${BACKUP_ENV_FILE:-/etc/backup.env}"
# shellcheck source=/dev/null
[ -f "$ENV_FILE" ] && . "$ENV_FILE"

TIER="${1:?usage: run_backup.sh <tier> <keep>}"
KEEP="${2:?usage: run_backup.sh <tier> <keep>}"

BACKUP_ROOT="${BACKUP_DIR:-/backups}"
TIER_DIR="${BACKUP_ROOT}/${TIER}"
mkdir -p "$TIER_DIR"

STAMP="$(date '+%Y%m%d_%H%M%S')"
OUTPUT="${TIER_DIR}/${TIER}_${STAMP}.sql.gz"

echo "[backup] $(date '+%Y-%m-%d %H:%M:%S') creating ${OUTPUT}"
mysqldump \
    --host="${MYSQL_HOST:-db}" \
    --port="${MYSQL_PORT:-3306}" \
    --user="${MYSQL_USER:-root}" \
    --password="${MYSQL_ROOT_PASSWORD}" \
    --protocol=TCP \
    --skip-ssl \
    --single-transaction \
    --routines \
    --triggers \
    --quick \
    "${MYSQL_DATABASE:-thinky_games}" | gzip -9 > "$OUTPUT"

# Retention: list newest-first, keep the first $KEEP, delete the remainder.
kept=0
for dump in $(ls -1t "${TIER_DIR}"/*.sql.gz 2>/dev/null); do
    kept=$((kept + 1))
    if [ "$kept" -gt "$KEEP" ]; then
        echo "[backup] pruning old ${dump}"
        rm -f "$dump"
    fi
done
