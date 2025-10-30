# Use Node.js 20
FROM node:20-alpine

# Dependências úteis para binários do Prisma (algumas imagens precisam destas)
RUN apk add --no-cache libc6-compat openssl

# Set working directory
WORKDIR /app

# Defaults de produção
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/prod.db"
ENV UPLOAD_DIR="/app/uploads"

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm install --include=dev

# Copy source code
COPY . .

# Generate Prisma client (será regenerado no startup com a DATABASE_URL correta)
RUN npx prisma generate

# Build the application
RUN npm run build

# Verificar se os arquivos públicos foram gerados
RUN test -d .output/public/_nuxt && echo "✓ Arquivos _nuxt gerados" || echo "⚠ Arquivos _nuxt não encontrados"

# Remove dev dependencies after build (mantém o .output)
RUN npm prune --production

# Garantir que o diretório .output existe e tem permissões corretas
RUN chmod -R 755 .output 2>/dev/null || true

# Declarar volumes para persistência (o painel pode mapear ou manter entre restarts)
VOLUME ["/app/data", "/app/uploads"]

# Expose port
EXPOSE 3000

# Copiar script de inicialização
COPY scripts/init-db.sh /app/scripts/init-db.sh
RUN chmod +x /app/scripts/init-db.sh

# Start the application: executa script de inicialização e inicia o servidor
CMD ["sh", "-c", "/app/scripts/init-db.sh && node .output/server/index.mjs"]