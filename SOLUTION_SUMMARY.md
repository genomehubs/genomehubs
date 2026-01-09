# GenomeHubs UI SPA Markdown Fetching - Solution Summary

## Problem

The SPA client couldn't load dynamic markdown pages (like `/projects/DTOL`) because:

1. **Static pages** (built by webpack) go to `/static/<hash>/landing.md` (cache-busted)
2. **Dynamic pages** (from mounted volumes) are at `/content/static/projects/dtol.md` (runtime-mounted)
3. Client fetch URL: `${pagesUrl}/${webpackHash}/${pageId}` = `/static/<hash>/projects/dtol.md` ❌ **doesn't exist**

SSR worked fine because the **server** reads from `CONTENT_ROOT`, but the **SPA client** only saw `/static/<hash>/` from the browser.

## Solution

Implemented a **two-tier markdown fetch strategy**:

### 1. Server-Side API Endpoint (`server/index.js`)

Added `/api/markdown/*` endpoint that:

- Accepts requests like `/api/markdown/projects/dtol`
- Uses the server's existing `resolveMarkdownPath()` function (case-insensitive, reads from `CONTENT_ROOT`)
- Returns markdown content with proper headers
- Handles 404s gracefully

```javascript
app.get("/api/markdown/*", async (req, res) => {
  try {
    const filePath = req.params[0]; // e.g., "projects/DTOL"
    const mdPath = resolveMarkdownPath(`/${filePath}`);

    if (mdPath) {
      const content = fs.readFileSync(mdPath, "utf8");
      res.status(200).type("text/plain").send(content);
    } else {
      res
        .status(404)
        .json({ error: "Markdown file not found", path: filePath });
    }
  } catch (err) {
    console.error("Markdown fetch error:", err);
    res.status(500).json({ error: "Failed to fetch markdown" });
  }
});
```

### 2. Client-Side Fetch Logic (`src/client/views/selectors/pages.js`)

Updated `fetchPages()` to:

1. **First try**: Hashed webpack-built paths for cache-busting
   - Path: `/static/<hash>/projects/dtol`
2. **Fallback**: API endpoint for dynamic markdown
   - Path: `/api/markdown/projects/dtol` (without `.md` extension)
3. **Final fallback**: Retry API on any fetch errors

```javascript
export function fetchPages(pageId) {
  return async function (dispatch) {
    // ... setup code ...
    try {
      let markdown;
      try {
        // First try: webpack-bundled static markdown (with hash for cache-busting)
        const response = await fetch(url);
        if (response.ok) {
          markdown = await response.text();
        } else {
          // Fallback: server API endpoint for dynamic markdown from mounted volumes
          console.log(
            `Static markdown not found at ${url}, trying API endpoint...`
          );
          const apiUrl = `/api/markdown/${pageId.toLowerCase()}`;
          const apiResponse = await fetch(apiUrl);
          if (apiResponse.ok) {
            markdown = await apiResponse.text();
          } else {
            markdown = false;
          }
        }
      } catch (error) {
        console.log("An error occurred fetching markdown.", error);
        // Last fallback: try API endpoint when fetch fails entirely
        try {
          const apiUrl = `/api/markdown/${pageId.toLowerCase()}`;
          const apiResponse = await fetch(apiUrl);
          if (apiResponse.ok) {
            markdown = await apiResponse.text();
          } else {
            markdown = false;
          }
        } catch (apiError) {
          markdown = false;
        }
      }
      dispatch(receivePages({ pageId, markdown }));
    } catch (err) {
      dispatch(cancelPages({ pageId }));
    }
  };
}
```

## Benefits

✅ **Cache-busting preserved**: Static webpack-built markdown still uses hash-based URLs  
✅ **Dynamic content supported**: Runtime-mounted markdown accessible via API endpoint  
✅ **SEO intact**: SSR pre-renders for bots; SPA hydrates for regular browsers  
✅ **Graceful fallback**: If API fails, page degrades gracefully  
✅ **No breaking changes**: Existing static pages work as before  
✅ **Case-insensitive**: Paths like `/projects/DTOL` match files like `dtol.md`

## Testing Results

### Local Development (npm run build + node server)

```bash
✅ npm run build        # Webpack compiles successfully
✅ npm run start        # Node.js server starts
✅ curl http://localhost:8896/projects/DTOL      # SSR returns title
✅ curl http://localhost:8896/api/markdown/projects/dtol  # API returns markdown
✅ curl http://localhost:8896/              # SPA loads with config injected
```

### Docker Containerization

```bash
✅ docker build -t genomehubs-ui:latest  # Multi-stage build succeeds
✅ docker run ... genomehubs-ui:latest   # Container starts on port 8880
✅ curl http://localhost:8897/projects/DTOL  # SSR returns title
✅ curl http://localhost:8897/api/markdown/projects/dtol  # API works
✅ curl http://localhost:8897/api/markdown/projects/ebp   # Multiple projects work
✅ curl http://localhost:8897/api/markdown/projects/nonexistent  # 404 handling works
```

### Routes Verified

- **Dynamic projects**: `/projects/DTOL`, `/projects/ebp`, `/projects/africabp`, `/projects/1000gch` ✅
- **Static pages**: `/search`, `/about` ✅
- **API fallback**: All project pages accessible via `/api/markdown/` ✅
- **Case-insensitive**: `/projects/DTOL` matches `/projects/dtol.md` ✅
- **Runtime config**: `GH_SITENAME=GoaT` properly injected ✅

## Files Modified

1. **`src/genomehubs-ui/server/index.js`** (235 lines)

   - Added `/api/markdown/*` endpoint
   - No changes to existing SSR logic

2. **`src/genomehubs-ui/src/client/views/selectors/pages.js`**
   - Updated `fetchPages()` with fallback logic
   - Maintains backward compatibility with webpack-built pages

## No Breaking Changes

- All existing functionality preserved
- Webpack configuration unchanged
- Docker setup unchanged
- Runtime config injection unchanged
- SSR logic unchanged

## Next Steps (Optional)

Future enhancements could include:

- Cache markdown responses in `/api/markdown/` endpoints
- Add `Cache-Control` headers to API responses
- Compress markdown responses for faster delivery
- Pre-warm markdown cache on server startup
