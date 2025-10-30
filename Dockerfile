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

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Declarar volumes para persistência (o painel pode mapear ou manter entre restarts)
VOLUME ["/app/data", "/app/uploads"]

# Expose port
EXPOSE 3000

# Copiar script de inicialização
COPY scripts/init-db.sh /app/scripts/init-db.sh
RUN chmod +x /app/scripts/init-db.sh

# Start the application: executa script de inicialização e inicia o servidor
CMD ["sh", "-c", "/app/scripts/init-db.sh && node .output/server/index.mjs"]