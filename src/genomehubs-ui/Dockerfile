# Multi-stage build for GenomeHubs UI running in Node container

# --- Builder stage: build static assets ---
FROM node:22-alpine AS builder
WORKDIR /app

# Install build dependencies (git required for git-revision-webpack-plugin)
RUN apk add --no-cache git

# Install build deps
COPY package.json package-lock.json* yarn.lock* ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# --- Runtime stage: run SSR server ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy only needed runtime files
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/server /app/server
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

# Install production deps only (for server + any transformers)
RUN npm ci --omit=dev --no-audit --no-fund --legacy-peer-deps

# Content mount point (markdown repos)
VOLUME ["/content"]

# Configurable base path and port
ENV BASE_PATH=/
ENV PORT=8880
ENV CONTENT_ROOT=/content/static
ENV SSR_MODE=bots

EXPOSE 8880
CMD ["node", "server/index.js"]
