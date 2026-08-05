#!/bin/sh
# EQX — Verificar integridade do último backup
# Corre manualmente para testar se o backup pode ser restaurado.

set -e

BACKUP_DIR="/backups"

if ! command -v pg_restore >/dev/null 2>&1; then
  apk add --no-cache postgresql16-client >/dev/null 2>&1
fi

echo "=== EQX Backup Verification ==="
echo "Backup dir: $BACKUP_DIR"
echo ""

# Listar backups disponíveis
echo "Backups disponíveis:"
ls -lh "$BACKUP_DIR"/eqx-*.dump 2>/dev/null || echo "  Nenhum ficheiro .dump encontrado."
ls -lh "$BACKUP_DIR"/eqx-*.sql.gz 2>/dev/null || echo "  Nenhum ficheiro .sql.gz encontrado."
echo ""

# Verificar o backup mais recente
LATEST=$(ls -t "$BACKUP_DIR"/eqx-*.dump 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  echo "❌ Nenhum backup encontrado para verificar."
  exit 1
fi

echo "Último backup: $LATEST"

# Verificar integridade do .dump (pg_restore --list valida o ficheiro sem restaurar)
echo ""
echo "🔍 A verificar integridade..."
if pg_restore --list "$LATEST" > /dev/null 2>&1; then
  echo "✅ Backup íntegro: $(basename "$LATEST")"
  echo "   Tamanho: $(du -h "$LATEST" | cut -f1)"
else
  echo "❌ Backup corrompido: $(basename "$LATEST")"
  exit 1
fi

echo ""
echo "=== Verificação concluída ==="
echo ""
echo "Para restaurar este backup:"
echo "  pg_restore -d \"\$SUPABASE_DB_URL\" --clean --if-exists $LATEST"
