## Build stage
FROM node:24-bookworm-slim AS builder
WORKDIR /app
## Copy only API package manifests first for better layer caching
COPY src/genomehubs-api/package.json src/genomehubs-api/package-lock.json ./
RUN npm ci --production=false
## Copy API sources
COPY src/genomehubs-api/. .
## Generate static operation handlers into src/generated (bundled import) and bundle the app
RUN npm run build:bundle
## Prepare logs directory in builder so it can be copied into runtime
RUN mkdir -p /app/logs \
    && chown -R node:node /app/logs \
    && chmod -R 0755 /app/logs

## Final runtime stage
FROM gcr.io/distroless/nodejs24-debian12
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
## Copy production node_modules into runtime
COPY --from=builder --chown=nonroot:nonroot /app/node_modules /app/node_modules
## Copy pre-created logs directory (permissions preserved)
COPY --from=builder --chown=nonroot:nonroot /app/logs /app/logs
EXPOSE 3000
ENV NODE_ENV=production
# Note: HEALTHCHECK not supported in distroless (no shell). Use external monitoring or k8s probes.
# Run the bundled server (no node_modules in runtime)
CMD ["--no-deprecation", "build/bundle.cjs"]