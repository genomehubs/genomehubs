## Build stage
FROM node:24-bookworm-slim AS builder
WORKDIR /app

## Install build dependencies (git required for git-revision-webpack-plugin)
RUN apt-get update && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*

## Copy UI package manifests and config first for better layer caching
COPY src/genomehubs-ui/package.json src/genomehubs-ui/package-lock.json src/genomehubs-ui/.npmrc ./
RUN npm ci --production=false

## Copy UI sources
COPY src/genomehubs-ui/. .

## Build static assets with webpack
RUN npm run build

## Install production dependencies only
RUN npm ci --omit=dev --production=true

## Prepare logs directory in builder
RUN mkdir -p /app/logs \
    && chown -R node:node /app/logs \
    && chmod -R 0755 /app/logs

## Runtime stage - use distroless for minimal footprint
FROM gcr.io/distroless/nodejs20-debian12
WORKDIR /app

## Copy built assets and server code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

## Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

## Copy pre-created logs directory
COPY --from=builder --chown=nonroot:nonroot /app/logs /app/logs

## Content mount point (markdown repos)
VOLUME ["/content"]

## Configuration via environment variables
ENV NODE_ENV=production
ENV BASE_PATH=/
ENV PORT=8880
ENV CONTENT_ROOT=/content/static
ENV SSR_MODE=bots

EXPOSE 8880

## Run SSR server
CMD ["src/server/index.js"]