#!/bin/sh
set -e

echo "=== Iniciando aplicação em produção ==="

# Verificar e criar diretórios de volumes persistentes
echo "Verificando volumes persistentes..."
echo "DATABASE_URL: ${DATABASE_URL:-file:/app/data/prod.db}"
echo "UPLOAD_DIR: ${UPLOAD_DIR:-/app/uploads}"

# Garantir que os diretórios existam (podem estar vazios se volume foi montado)
mkdir -p /app/data /app/uploads
chmod 755 /app/data /app/uploads

# Verificar se os diretórios são volumes (testando se podemos escrever)
if touch /app/data/.test_write 2>/dev/null; then
  rm -f /app/data/.test_write
  echo "✓ Diretório /app/data é gravável"
else
  echo "⚠ AVISO: Diretório /app/data pode não ter permissões de escrita"
fi

if touch /app/uploads/.test_write 2>/dev/null; then
  rm -f /app/uploads/.test_write
  echo "✓ Diretório /app/uploads é gravável"
else
  echo "⚠ AVISO: Diretório /app/uploads pode não ter permissões de escrita"
fi

# Verificar se o banco existe ou criar
DB_PATH="/app/data/prod.db"
if [ ! -f "$DB_PATH" ]; then
  echo "Banco de dados não existe, criando novo arquivo..."
  touch "$DB_PATH"
  chmod 644 "$DB_PATH"
  echo "✓ Arquivo de banco criado: $DB_PATH"
else
  echo "✓ Banco de dados encontrado: $DB_PATH ($(du -h "$DB_PATH" | cut -f1))"
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

# Verificar se a tabela admin_sessions existe (CRÍTICO para persistência de sessões)
echo "Verificando tabela admin_sessions (essencial para sessões persistentes)..."
if command -v sqlite3 >/dev/null 2>&1; then
  HAS_ADMIN_SESSIONS=$(sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='admin_sessions';" 2>/dev/null | grep -q "admin_sessions" && echo "yes" || echo "no")
  
  if [ "$HAS_ADMIN_SESSIONS" != "yes" ]; then
    echo "⚠ AVISO CRÍTICO: Tabela admin_sessions não encontrada!"
    echo "Tentando aplicar migração manualmente..."
    
    if [ -f "prisma/migrations/20250101000000_add_admin_sessions/migration.sql" ]; then
      if sqlite3 "$DB_PATH" < prisma/migrations/20250101000000_add_admin_sessions/migration.sql 2>/dev/null; then
        echo "✓ Migração admin_sessions aplicada com sucesso!"
        # Regenerar Prisma Client após migração manual
        npx prisma generate || echo "⚠ AVISO: Falha ao regenerar Prisma Client"
      else
        echo "✗ ERRO: Não foi possível aplicar migração manualmente!"
        echo "Tentando usar prisma db push como fallback..."
        npx prisma db push --accept-data-loss --skip-generate || {
          echo "✗ ERRO CRÍTICO: Não foi possível criar tabela admin_sessions!"
          echo "As sessões NÃO serão persistentes até que a tabela seja criada."
        }
        npx prisma generate || echo "⚠ AVISO: Falha ao regenerar Prisma Client"
      fi
    else
      echo "✗ ERRO: Arquivo de migração não encontrado!"
      echo "Tentando usar prisma db push como fallback..."
      npx prisma db push --accept-data-loss --skip-generate || {
        echo "✗ ERRO CRÍTICO: Não foi possível criar tabela admin_sessions!"
      }
      npx prisma generate || echo "⚠ AVISO: Falha ao regenerar Prisma Client"
    fi
  else
    echo "✓ Tabela admin_sessions encontrada - sessões serão persistentes!"
  fi
  
  # Verificar e corrigir status NULL na tabela titles
  echo "Verificando campos de validação na tabela titles..."
  HAS_STATUS_COLUMN=$(sqlite3 "$DB_PATH" "PRAGMA table_info(titles);" 2>/dev/null | grep -q "status" && echo "yes" || echo "no")
  
  if [ "$HAS_STATUS_COLUMN" != "yes" ]; then
    echo "⚠ Campos de validação não encontrados na tabela titles!"
    echo "Aplicando migração manualmente..."
    if [ -f "prisma/migrations/20250115000000_add_title_validation_fields/migration.sql" ]; then
      if sqlite3 "$DB_PATH" < prisma/migrations/20250115000000_add_title_validation_fields/migration.sql 2>/dev/null; then
        echo "✓ Campos de validação adicionados com sucesso!"
        npx prisma generate || echo "⚠ AVISO: Falha ao regenerar Prisma Client"
      else
        echo "✗ ERRO: Não foi possível aplicar migração de campos de validação!"
      fi
    fi
  else
    # Garantir que todos os registros com status NULL sejam atualizados para 'pending'
    NULL_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM titles WHERE status IS NULL;" 2>/dev/null || echo "0")
    if [ "$NULL_COUNT" != "0" ] && [ "$NULL_COUNT" != "" ]; then
      echo "⚠ Encontrados $NULL_COUNT registros com status NULL. Atualizando para 'pending'..."
      sqlite3 "$DB_PATH" "UPDATE titles SET status = 'pending' WHERE status IS NULL;" 2>/dev/null && \
        echo "✓ Registros atualizados com sucesso!" || \
        echo "⚠ AVISO: Não foi possível atualizar todos os registros"
    else
      echo "✓ Todos os registros de titles têm status definido"
    fi
  fi
else
  echo "⚠ sqlite3 não disponível. Assumindo que migrações foram aplicadas corretamente."
fi

echo "=== Iniciando servidor ==="
exec node .output/server/index.mjs

