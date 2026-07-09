FROM debian:bookworm-slim

# default-mysql-client provides mysqldump; cron provides the scheduler.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        cron \
        default-mysql-client \
        gzip \
    && rm -rf /var/lib/apt/lists/*

COPY run_backup.sh /usr/local/bin/run_backup.sh
COPY entrypoint.sh /usr/local/bin/backup-entrypoint.sh
RUN chmod +x /usr/local/bin/run_backup.sh /usr/local/bin/backup-entrypoint.sh

VOLUME ["/backups"]

ENTRYPOINT ["/usr/local/bin/backup-entrypoint.sh"]
