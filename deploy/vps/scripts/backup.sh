#!/bin/sh
# EQX — Backup diário do Supabase PostgreSQL
# Corre às 3h via cron dentro do container

set -e

# Instalar pg_dump no container Alpine (one-time)
if ! command -v pg_dump >/dev/null 2>&1; then
  apk add --no-cache postgresql16-client >/dev/null 2>&1
fi

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups"
RETENTION_DAYS=30

# Fazer dump (connection string from .env)
pg_dump "$SUPABASE_DB_URL" --no-owner --no-acl --format=custom \
  -f "$BACKUP_DIR/eqx-$DATE.dump" 2>&1

# Criar também dump em plain SQL (mais portável)
pg_dump "$SUPABASE_DB_URL" --no-owner --no-acl --format=plain \
  | gzip > "$BACKUP_DIR/eqx-$DATE.sql.gz" 2>&1

# Apagar backups antigos (>30 dias)
find "$BACKUP_DIR" -name "eqx-*.dump" -mtime +$RETENTION_DAYS -delete 2>/dev/null
find "$BACKUP_DIR" -name "eqx-*.sql.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null

echo "[$(date)] Backup OK: eqx-$DATE.dump + eqx-$DATE.sql.gz"
echo "[$(date)] Backups em disco: $(ls -1 $BACKUP_DIR/eqx-* 2>/dev/null | wc -l) ficheiros"
