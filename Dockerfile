# ---- Build frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Production image ----
FROM node:20-alpine

# better-sqlite3 needs build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ .

# Copy built frontend where backend expects it: ../../frontend/dist → /app/frontend/dist
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Persistent data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3001
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3001/api/bot/status || exit 1

CMD ["node", "src/index.js"]
