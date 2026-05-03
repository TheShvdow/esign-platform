# Multi-stage build for backend
FROM node:25-alpine3.22 AS builder

WORKDIR /app/apps/backend

# Copy backend package definitions and install dependencies
COPY apps/backend/package*.json ./
RUN npm ci

# Copy source and build the app
COPY apps/backend .
RUN npm run build

# Production image
FROM node:25-alpine3.22 AS production

WORKDIR /app/apps/backend

COPY apps/backend/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/apps/backend/dist ./dist
COPY docker/healthcheck.js ./healthcheck.js

# Non-root user for better security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "healthcheck.js"]

CMD ["node", "dist/main.js"]
