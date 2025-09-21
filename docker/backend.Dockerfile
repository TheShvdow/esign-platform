# Multi-stage build pour optimiser la taille
FROM node:20-alpine AS builder

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Installation des dépendances
RUN npm ci --only=production && npm cache clean --force

# Copie du code source
COPY apps/backend ./apps/backend

# Build de l'application
WORKDIR /app/apps/backend
RUN npm run build

# Image de production
FROM node:20-alpine AS production

# Sécurité : utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app

# Copie des node_modules et build
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package*.json ./

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3001

# Exposition du port
EXPOSE 3001

# Utilisateur non-root
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Commande de démarragedocker-compose.ymlyml# Commande de démarragedocker-compose.ymlyml

CMD ["node", "dist/main.js"] 