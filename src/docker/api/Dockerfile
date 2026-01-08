## Build stage (DHI build image)
FROM dhi.io/node:24-debian13-dev AS builder
WORKDIR /app
## Copy only API package manifests first for better layer caching
COPY src/genomehubs-api/package.json src/genomehubs-api/package-lock.json ./
RUN npm ci --production=false
## Copy API sources
COPY src/genomehubs-api/. .
## Generate static operation handlers into src/generated (bundled import) and bundle the app
RUN node scripts/generate-operation-handlers.cjs src/generated && \
    npm run build:bundle
## Prepare logs directory in builder so it can be copied into runtime
RUN mkdir -p /app/logs \
    && chown -R node:node /app/logs \
    && chmod -R 0755 /app/logs

## Final runtime stage (DHI runtime image)
FROM dhi.io/node:24
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
## Copy pre-created logs directory (permissions preserved) and run as node user
COPY --from=builder --chown=node:node /app/logs /app/logs
USER node
EXPOSE 3000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD node -e "const http=require('http'); const p=process.env.GH_API_PORT||3000; const req=http.request({method:'GET', host:'127.0.0.1', port:p, path:'/health', timeout:4000}, res=>{ if(res.statusCode===200) process.exit(0); else process.exit(1); }); req.on('error', ()=>process.exit(1)); req.end();"
# Run the bundled server (no node_modules in runtime)
CMD ["node", "build/bundle.cjs"]