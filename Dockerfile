# Multi-stage Dockerfile for Worktime Management System

# ============================================
# Stage 1: Backend Builder
# ============================================
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm install --only=production

# Copy backend source
COPY backend/ ./

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ============================================
# Stage 2: Frontend Builder
# ============================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source
COPY frontend/ ./

# Build production bundle
RUN npm run build

# ============================================
# Stage 3: Production Image
# ============================================
FROM node:20-alpine

WORKDIR /app

# Install PostgreSQL client for migrations and OpenSSL for Prisma
RUN apk add --no-cache postgresql-client openssl

# Copy backend production files
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY backend/package*.json ./

# Install build dependencies and rebuild native modules
RUN apk add --no-cache --virtual .build-deps python3 make g++ && \
    npm rebuild bcrypt --build-from-source && \
    npx prisma generate && \
    apk del .build-deps

# Copy frontend build (served as static files from Express)
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose port
EXPOSE 3000

# Start command (migrations run on startup)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
