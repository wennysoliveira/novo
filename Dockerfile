# Use Node.js 20
FROM node:20-alpine

# Dependências úteis para binários do Prisma (algumas imagens precisam destas)
# sqlite3 para verificação e aplicação manual de migrações se necessário
RUN apk add --no-cache libc6-compat openssl sqlite

# Set working directory
WORKDIR /app

# Defaults de produção
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/prod.db"
ENV UPLOAD_DIR="/app/uploads"

# Criar diretórios de dados e uploads com permissões corretas
# Estes diretórios serão volumes persistentes
RUN mkdir -p /app/data /app/uploads && \
    chmod 755 /app/data /app/uploads && \
    touch /app/data/.dockerkeep /app/uploads/.dockerkeep && \
    chmod 644 /app/data/.dockerkeep /app/uploads/.dockerkeep

# Declarar volumes ANTES de qualquer operação que possa escrever dados
# IMPORTANTE: A diretiva VOLUME declara que estes diretórios devem ser volumes.
# Para garantir persistência REAL dos dados entre rebuilds/restarts:
# 1. No EasyPanel/Docker: Configure bind mounts ou volumes nomeados apontando para:
#    - /app/data -> volume persistente para o banco SQLite
#    - /app/uploads -> volume persistente para arquivos enviados
# 2. Se não configurar bind mounts, os dados serão perdidos ao remover o container!
VOLUME ["/app/data", "/app/uploads"]

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install --include=dev

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Copy startup script
COPY scripts/start-prod.sh /app/scripts/start-prod.sh
RUN chmod +x /app/scripts/start-prod.sh

# Remove dev dependencies after build (mas manter prisma para migrations)
RUN npm prune --production
RUN npm install prisma --save

# Expose port
EXPOSE 3000

# Start the application usando o script de inicialização
CMD ["/app/scripts/start-prod.sh"]