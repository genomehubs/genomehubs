## Build stage (DHI build image)
FROM dhi.io/node:24-debian13-dev AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build:bundle
## Prepare logs directory in builder so it can be copied into distroless runtime
RUN mkdir -p /app/logs \
    && chown -R node:node /app/logs \
    && chmod -R 0755 /app/logs
## Install production dependencies in builder and then copy them into runtime
RUN npm ci --only=production
## Remove unnecessary files (docs, tests, examples) from node_modules to shrink image
RUN npx modclean -r --no-progress || true


## Final runtime stage (DHI runtime image)
FROM dhi.io/node:24
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/build/wrappers ./build/wrappers
COPY --from=builder /app/package.json ./package.json
## Copy pre-created logs directory (permissions preserved) and run as node user
COPY --from=builder --chown=node:node /app/logs /app/logs
## Copy production node_modules from builder
COPY --from=builder /app/node_modules /app/node_modules
USER node
EXPOSE 3000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD node -e "const http=require('http'); const p=process.env.GH_API_PORT||3000; const req=http.request({method:'GET', host:'127.0.0.1', port:p, path:'/health', timeout:4000}, res=>{ if(res.statusCode===200) process.exit(0); else process.exit(1); }); req.on('error', ()=>process.exit(1)); req.end();"
CMD ["node", "build/bundle.cjs"]
