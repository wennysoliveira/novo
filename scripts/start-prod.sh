#!/bin/sh
set -e

echo "=== Iniciando aplicação em produção ==="

# Criar diretórios necessários
echo "Criando diretórios..."
mkdir -p /app/data /app/uploads
chmod 755 /app/data /app/uploads

# Verificar se o banco existe
DB_PATH="/app/data/prod.db"
if [ ! -f "$DB_PATH" ]; then
  echo "Banco de dados não existe, criando..."
  touch "$DB_PATH"
  chmod 644 "$DB_PATH"
fi

# Regenerar Prisma Client (necessário após mudanças no schema)
echo "Regenerando Prisma Client..."
npx prisma generate || {
  echo "ERRO: Falha ao gerar Prisma Client"
  exit 1
}

# Aplicar migrações
echo "Aplicando migrações do banco de dados..."
npx prisma migrate deploy || {
  echo "AVISO: migrate deploy falhou, tentando db push..."
  npx prisma db push --accept-data-loss || {
    echo "ERRO: Falha ao aplicar migrações"
    exit 1
  }
}

# Verificar se sqlite3 está disponível para verificação
if command -v sqlite3 >/dev/null 2>&1; then
  echo "Verificando estrutura do banco..."
  HAS_ADMIN_SESSIONS=$(sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='admin_sessions';" 2>/dev/null)
  
  if [ -z "$HAS_ADMIN_SESSIONS" ]; then
    echo "AVISO: Tabela admin_sessions não encontrada. Tentando aplicar migração manualmente..."
    if [ -f "prisma/migrations/20250101000000_add_admin_sessions/migration.sql" ]; then
      sqlite3 "$DB_PATH" < prisma/migrations/20250101000000_add_admin_sessions/migration.sql 2>/dev/null && echo "Migração aplicada com sucesso" || echo "AVISO: Não foi possível aplicar migração manualmente"
      # Regenerar Prisma Client após migração manual
      npx prisma generate || echo "AVISO: Falha ao regenerar Prisma Client"
    fi
  else
    echo "Tabela admin_sessions encontrada."
  fi
else
  echo "sqlite3 não disponível. Pulando verificação manual."
fi

echo "=== Iniciando servidor ==="
exec node .output/server/index.mjs

