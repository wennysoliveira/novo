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

# Garantir diretórios de dados e uploads
RUN mkdir -p /app/data /app/uploads

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

# Declarar volumes para persistência (o painel pode mapear ou manter entre restarts)
VOLUME ["/app/data", "/app/uploads"]

# Expose port
EXPOSE 3000

# Start the application usando o script de inicialização
CMD ["/app/scripts/start-prod.sh"]