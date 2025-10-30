#!/bin/sh
set -e

echo "Iniciando inicialização do banco de dados..."

# Criar diretórios necessários
echo "Criando diretórios..."
mkdir -p /app/data /app/uploads

# Garantir permissões
chmod 755 /app/data /app/uploads

# Extrair caminho do banco de dados da variável DATABASE_URL
# Formato esperado: file:/app/data/prod.db ou file:///app/data/prod.db ou file:./app/data/prod.db
DB_PATH=$(echo "$DATABASE_URL" | sed 's|^file://*||' | sed 's|^file:||')

echo "DATABASE_URL: $DATABASE_URL"
echo "DB_PATH extraído: $DB_PATH"

# Normalizar caminho: remover ./ no início se presente
DB_PATH=$(echo "$DB_PATH" | sed 's|^\./||')

# Se não começou com /, considerar relativo ao /app
if [ "${DB_PATH#/}" = "$DB_PATH" ]; then
  DB_PATH="/app/$DB_PATH"
fi

# Normalizar caminho (remover duplicatas como /app/./app/)
DB_PATH=$(echo "$DB_PATH" | sed 's|/\./|/|g' | sed 's|/\.\.|/..|g')

# Extrair diretório do arquivo
DB_DIR=$(dirname "$DB_PATH")

echo "Criando diretório do banco: $DB_DIR"

# Criar diretório do banco se não existir
mkdir -p "$DB_DIR"
chmod 755 "$DB_DIR"

# Verificar se o diretório foi criado
if [ ! -d "$DB_DIR" ]; then
  echo "ERRO: Não foi possível criar o diretório $DB_DIR"
  exit 1
fi

echo "Diretório criado com sucesso: $DB_DIR"

# Regenerar Prisma Client com o DATABASE_URL correto
echo "Regenerando Prisma Client com DATABASE_URL=$DATABASE_URL..."
npx prisma generate

# Executar migrações
echo "Executando migrações do banco de dados..."
if npx prisma migrate deploy 2>&1; then
  echo "Migrações aplicadas com sucesso via migrate deploy"
else
  echo "migrate deploy falhou, tentando db push..."
  npx prisma db push 2>&1 || {
    echo "ERRO: Falha ao inicializar banco de dados"
    exit 1
  }
  echo "Banco de dados criado via db push"
fi

# Verificar se o arquivo do banco foi criado
if [ -f "$DB_PATH" ]; then
  echo "Banco de dados criado com sucesso em: $DB_PATH"
else
  echo "AVISO: Arquivo do banco não encontrado em $DB_PATH (pode ser criado na primeira conexão)"
fi

echo "Banco de dados inicializado com sucesso!"

