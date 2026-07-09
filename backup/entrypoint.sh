#!/bin/sh
# Entry point for the backup container.
#
# Persists the database credentials so cron jobs can read them, installs the
# tiered backup schedule, and then runs cron in the foreground.
#
# If arguments are provided (e.g. `run_backup.sh daily 5`), they are executed
# once and the container exits — handy for manual/on-demand backups.
set -eu

ENV_FILE=/etc/backup.env
BACKUP_ROOT="${BACKUP_DIR:-/backups}"

cat > "$ENV_FILE" <<EOF
export MYSQL_HOST="${MYSQL_HOST:-db}"
export MYSQL_PORT="${MYSQL_PORT:-3306}"
export MYSQL_USER="${MYSQL_USER:-root}"
export MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-thinky}"
export MYSQL_DATABASE="${MYSQL_DATABASE:-thinky_games}"
export BACKUP_DIR="${BACKUP_ROOT}"
EOF
chmod 600 "$ENV_FILE"

mkdir -p "$BACKUP_ROOT"

# On-demand mode: run whatever was passed and exit.
if [ "$#" -gt 0 ]; then
    exec "$@"
fi

# Retention policy (kept copies):
#   daily   -> 5 days,   weekly -> 3 weeks,
#   monthly -> 6 months, yearly -> 3 years.
cat > /etc/cron.d/backup-cron <<'CRON'
0 2 * * *  root /usr/local/bin/run_backup.sh daily 5    >> /backups/backup.log 2>&1
0 3 * * 0  root /usr/local/bin/run_backup.sh weekly 3   >> /backups/backup.log 2>&1
0 4 1 * *  root /usr/local/bin/run_backup.sh monthly 6  >> /backups/backup.log 2>&1
0 5 1 1 *  root /usr/local/bin/run_backup.sh yearly 3   >> /backups/backup.log 2>&1
CRON

chmod 0644 /etc/cron.d/backup-cron
touch /backups/backup.log

echo "[backup] schedule installed; starting cron"
exec cron -f
