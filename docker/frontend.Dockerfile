# Dependencies stage
FROM node:20-alpine AS deps
WORKDIR /app/apps/frontend
COPY apps/frontend/package*.json ./
RUN npm ci

# Production build stage
FROM deps AS build
WORKDIR /app/apps/frontend
COPY apps/frontend .
RUN npm run build -- --configuration production

# Production runtime image
FROM nginx:stable-alpine AS production
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist/frontend /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Development stage
FROM deps AS dev
WORKDIR /app/apps/frontend
COPY apps/frontend .
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "3000"]
