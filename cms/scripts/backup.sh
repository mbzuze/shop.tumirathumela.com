#!/usr/bin/env bash
# Daily backup: PostgreSQL dump + media rsync
# Cron: 0 2 * * * /opt/tumiracms/scripts/backup.sh >> /var/log/tumiracms-backup.log 2>&1

set -euo pipefail

BACKUP_ROOT="/var/backups/tumiracms"
MEDIA_ROOT="${MEDIA_ROOT:?MEDIA_ROOT must be set}"
RETAIN_DAYS=14

DATE=$(date +%Y-%m-%d)
DB_BACKUP="$BACKUP_ROOT/db"
MEDIA_BACKUP="$BACKUP_ROOT/media"

mkdir -p "$DB_BACKUP" "$MEDIA_BACKUP"

echo "[$(date -Iseconds)] Starting TumiraCMS backup..."

# ── DB dump ──────────────────────────────────────────────────────────────────
DUMP_FILE="$DB_BACKUP/tumiracms-$DATE.sql.gz"
PGPASSWORD="${POSTGRES_PASSWORD:-}" \
  pg_dump \
    -h "${POSTGRES_HOST:-127.0.0.1}" \
    -p "${POSTGRES_PORT:-5432}" \
    -U "${POSTGRES_USER:-tumiracms}" \
    "${POSTGRES_DB:-tumiracms}" \
  | gzip > "$DUMP_FILE"

echo "[$(date -Iseconds)] DB dump: $DUMP_FILE ($(du -sh "$DUMP_FILE" | cut -f1))"

# ── Media sync ───────────────────────────────────────────────────────────────
rsync -a --delete "$MEDIA_ROOT/" "$MEDIA_BACKUP/"
echo "[$(date -Iseconds)] Media synced: $MEDIA_BACKUP ($(du -sh "$MEDIA_BACKUP" | cut -f1))"

# ── Prune old DB dumps ───────────────────────────────────────────────────────
find "$DB_BACKUP" -name "*.sql.gz" -mtime +"$RETAIN_DAYS" -delete
PRUNED=$(find "$DB_BACKUP" -name "*.sql.gz" | wc -l)
echo "[$(date -Iseconds)] DB dumps retained: $PRUNED (${RETAIN_DAYS}-day window)"

echo "[$(date -Iseconds)] Backup complete."
