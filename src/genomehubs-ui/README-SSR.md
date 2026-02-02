# GenomeHubs UI - Server-Side Rendering (SSR)

## Overview

The GenomeHubs UI now runs in a Node.js container with SSR support for SEO while maintaining full SPA functionality. Markdown content from external repositories (e.g., `goat-ui`) is pre-rendered for search engines and injected into the HTML, while the client-side JavaScript hydrates the page for interactive navigation.

## Architecture

- **Express server** (`server/index.js`) serves built static assets and handles SSR
- **Markdown processing** with unified/remark/rehype pipeline
- **Route mapping**: `/projects/DTOL` → `CONTENT_ROOT/projects/DTOL.md` or `.../index.md`
- **SEO injection**: Title, meta description, and rendered HTML added to `index.html`
- **SPA preservation**: All client bundles remain intact for hydration

## Local Development

### Build and Run

```bash
cd src/genomehubs-ui

# Build the UI
npm run build

# Start SSR server (bot-only mode)
CONTENT_ROOT="/Users/rchallis/projects/genomehubs/goat-ui/static" \
SSR_MODE=bots \
PORT=8880 \
node server/index.js

# Or use npm scripts
CONTENT_ROOT="/path/to/goat-ui/static" npm run start:bots
```

### Test SSR

```bash
# Regular browser (no SSR in bots mode)
curl http://localhost:8880/projects/DTOL

# As search engine bot (triggers SSR)
curl -A "Googlebot" http://localhost:8880/projects/DTOL | grep "<title>"
```

## Docker

### Build Image

```bash
cd src/genomehubs-ui
docker build -t genomehubs-ui:latest .
```

### Run Container

```bash
docker run --rm -p 8880:8880 \
  -e BASE_PATH=/ \
  -e SSR_MODE=bots \
  -e CONTENT_ROOT=/content/static \
  -v /Users/rchallis/projects/genomehubs/goat-ui:/content \
  genomehubs-ui:latest
```

### Environment Variables

**Server Configuration:**

- `PORT`: Server port (default: 8880)
- `BASE_PATH`: URL base path, e.g. `/genomehubs` (default: `/`)
- `CONTENT_ROOT`: Path to markdown files inside container (default: `/content/static`)
- `SSR_MODE`:
  - `bots`: SSR only for search engine crawlers (default)
  - `all`: SSR for all requests
  - Any other value: No SSR

**Site Configuration (passed to client as window.process.ENV):**

- `GH_SITENAME`: Site name (default: "Demo GenomeHub")
- `GH_SITENAME_LONG`: Full site name (default: "")
- `GH_BASENAME`: URL basename for routing (default: "/")
- `GH_CITATION_URL`: Citation URL for site (default: "")
- `GH_API_URL`: API endpoint URL (default: "http://localhost:3000/api/v2")
- `GH_DEFAULT_INDEX`: Default search index (default: "taxon")
- `GH_SUGGESTED_TERM`: Suggested search term (default: "")
- `GH_TAXONOMY`: Taxonomy database to use (default: "ncbi")
- `GH_ARCHIVE`: Space-separated list of archive versions (default: "")
- `GH_HOST`: Server host (default: "localhost")
- `GH_HTTPS`: Enable HTTPS (default: "false")
- `GH_PAGES_PATH`: Static pages path (default: "/static")

### Volume Mounts

Mount your site-specific markdown repo at `/content`:

```bash
# For GoaT
-v /Users/rchallis/projects/genomehubs/goat-ui:/content

# For other sites
-v /path/to/site-ui:/content
```

The server expects markdown files under `CONTENT_ROOT` (e.g., `/content/static`).

## Route Mapping

The server maps URL paths to markdown files:

1. Try `{CONTENT_ROOT}/{path}.md`
2. Fall back to `{CONTENT_ROOT}/{path}/index.md`
3. If no markdown found, serve SPA `index.html`

Examples:

- `/projects/DTOL` → `static/projects/DTOL.md`
- `/about` → `static/about.md` or `static/about/index.md`
- `/` → `static/index.md` (if exists)

## SEO Features

When SSR is triggered (bots or all mode):

1. **Title extraction**: First `# Heading` becomes `<title>`
2. **Meta description**: First ~300 chars of text (cleaned of markdown syntax)
3. **Canonical URL**: Added for each page
4. **Pre-rendered HTML**: Injected into `<div id="root"><div id="ssr-content">...</div></div>`
5. **Client bundles**: Still included for SPA hydration

## Bundle Optimization

The UI is code-split into:

**Initial load (~3.76 MiB)**:

- main.js: 716 KB
- mui.js: 380 KB
- vendors.js: 2.24 MB
- konva.js: 194 KB
- leaflet.js: 188 KB
- proj4.js: 101 KB
- yaml.js: 77 KB
- dnd.js: 80 KB

**Async chunks** (loaded on demand):

- three.js: 1.2 MB (globe view)
- recharts.js: 274 KB (charts)
- countries-simple.geojson: 1.27 MB (maps at low zoom)
- countries.geojson: 2.14 MB (maps at zoom > 3)
- export.js: ~96 KB (download features)

## Deployment

### Multi-site Setup

Each site (GoaT, MolluscDB, etc.) can use the same Docker image with different content mounts:

```bash
# GoaT
docker run -p 8880:8880 \
  -v /path/to/goat-ui:/content \
  -e CONTENT_ROOT=/content/static \
  genomehubs-ui:latest

# MolluscDB
docker run -p 8881:8880 \
  -v /path/to/molluscdb-ui:/content \
  -e CONTENT_ROOT=/content/static \
  genomehubs-ui:latest
```

### Production Considerations

1. **Caching**: Consider adding a cache layer for frequently accessed markdown files
2. **CDN**: Serve static assets (js/css/images) from CDN
3. **Health checks**: Add `/health` endpoint to `server/index.js`
4. **Monitoring**: Log SSR requests separately from static asset requests

## Files Modified/Created

### New Files

- `server/index.js`: Express SSR server
- `Dockerfile`: Multi-stage Node container build
- `README-SSR.md`: This documentation

### Modified Files

- `package.json`: Added `express`, server start scripts, `rehype-stringify`
- `webpack.config.js`: Made git-revision-plugin safe for non-git environments

## Troubleshooting

### "Cannot find module" errors

Ensure dependencies are in `dependencies` not `devDependencies` if needed at runtime.

### No SSR content appearing

- Check `SSR_MODE` environment variable
- Verify `CONTENT_ROOT` path is correct
- Test with bot user agent: `curl -A "Googlebot" http://localhost:8880/path`

### Markdown file not found

- Check file exists at `{CONTENT_ROOT}/{path}.md`
- Verify volume mount is correct in Docker
- Check server logs for path resolution attempts

### Build failures

- Ensure `package-lock.json` exists and is committed
- Use `--legacy-peer-deps` for React 19 compatibility
- Git must be available in builder stage for webpack plugin
