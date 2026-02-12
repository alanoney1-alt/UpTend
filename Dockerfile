# UpTend Production Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build frontend + server
RUN npm run build

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=10 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5000}/health || exit 1

EXPOSE ${PORT:-5000}

ENV NODE_ENV=production

CMD ["node", "dist/index.cjs"]
