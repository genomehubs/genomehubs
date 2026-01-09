/*
 Minimal Node SSR server for GenomeHubs UI
 - Serves built SPA assets from dist/public
 - Pre-renders markdown files from a mounted content directory for SEO
 - Keeps SPA behavior: includes bundle scripts to hydrate client-side
*/

const path = require("path");
const fs = require("fs");
const express = require("express");
// Handle ESM modules imported via CommonJS require()
function esm(mod) {
  return mod && mod.default ? mod.default : mod;
}

const { unified } = require("unified");
const remarkParse = esm(require("remark-parse"));
const remarkGfm = esm(require("remark-gfm"));
const remarkRehype = esm(require("remark-rehype"));
const rehypeRaw = esm(require("rehype-raw"));
const rehypeStringify = esm(require("rehype-stringify"));

const app = express();

// Runtime configuration from environment variables
// Maps to window.process.ENV.* in client-side reducers
const runtimeConfig = {
  // From location.js
  GH_SITENAME: process.env.GH_SITENAME || "Demo GenomeHub",
  GH_BASENAME: process.env.GH_BASENAME || "/",
  // From api.js
  GH_API_URL: process.env.GH_API_URL || "http://localhost:3000/api/v0.0.1",
  // From search.js
  GH_DEFAULT_INDEX: process.env.GH_DEFAULT_INDEX || "assembly",
  GH_SUGGESTED_TERM: process.env.GH_SUGGESTED_TERM || "",
  // From archive.js (normalize to array)
  GH_ARCHIVE: (() => {
    const raw = process.env.GH_ARCHIVE || "";
    const s = String(raw).trim();
    if (!s || s === "false") return [];
    return s.split(/\s+/).filter(Boolean);
  })(),
  // Additional config
  GH_HOST: process.env.GH_HOST || "localhost",
  GH_HTTPS: process.env.GH_HTTPS || "false",
  GH_PAGES_PATH: process.env.GH_PAGES_PATH || "/static",
};

const PORT = process.env.PORT ? Number(process.env.PORT) : 8880;
const BASE_PATH = process.env.BASE_PATH || "/"; // e.g. "/genomehubs"
const BUILD_DIR = path.resolve(__dirname, "../dist/public");
const INDEX_HTML_PATH = path.join(BUILD_DIR, "index.html");
const CONTENT_ROOT = process.env.CONTENT_ROOT || "/content/static"; // mount external markdown repo here
const SSR_MODE = process.env.SSR_MODE || "all"; // "all" or "bots"

// Cache the built index.html template for injection
let indexHtml = "";
try {
  indexHtml = fs.readFileSync(INDEX_HTML_PATH, "utf8");
} catch (err) {
  console.error(
    "index.html not found. Did you run npm run build?",
    err.message,
  );
}

// Utility: basic bot UA detection
function isBot(req) {
  const ua = String(req.headers["user-agent"] || "").toLowerCase();
  return /(bot|crawl|spider|googlebot|bingbot|slurp|duckduckbot|baiduspider)/.test(
    ua,
  );
}

// Utility: map request path to potential markdown file(s)
function resolveMarkdownPath(urlPath) {
  // Normalize: remove base path and trailing slash
  const clean = urlPath
    .replace(new RegExp(`^${BASE_PATH.replace(/\/$/, "")}`), "")
    .replace(/\/$/, "");

  // Try "path.md" then "path/index.md" (case-sensitive first)
  const tryPaths = [
    path.join(CONTENT_ROOT, `${clean}.md`),
    path.join(CONTENT_ROOT, clean, "index.md"),
  ];

  for (const p of tryPaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return p;
    }
  }

  // Fallback: try case-insensitive match
  try {
    const parts = clean.split("/").filter(Boolean);
    let currentDir = CONTENT_ROOT;
    let resolvedPath = CONTENT_ROOT;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const entries = fs.readdirSync(currentDir);
      const match = entries.find((e) => e.toLowerCase() === part.toLowerCase());

      if (match) {
        resolvedPath = path.join(currentDir, match);
        currentDir = resolvedPath;
      } else {
        return null;
      }
    }

    // Try with .md extension
    const mdFile = resolvedPath + ".md";
    if (fs.existsSync(mdFile) && fs.statSync(mdFile).isFile()) {
      return mdFile;
    }

    // Try index.md inside directory
    const indexFile = path.join(resolvedPath, "index.md");
    if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
      return indexFile;
    }
  } catch (err) {
    // Silent fail for case-insensitive fallback
  }

  return null;
}

// Render markdown to HTML
async function renderMarkdownToHtml(mdContent) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .process(mdContent);
  return String(file);
}

// Inject SSR content into index.html, optionally augmenting basic meta tags
function injectIntoIndexHtml(
  ssrHtml,
  reqPath,
  titleText = null,
  descriptionText = null,
) {
  let html = indexHtml;

  // Inject runtime config EARLY in head so it's available before any scripts run
  // Define both window.process.ENV (for our code) and global webpack DefinePlugin variables
  const configScript = `<script>
window.process = window.process || {};
window.process.ENV = ${JSON.stringify(runtimeConfig)};
// Map to webpack DefinePlugin constants for compatibility
window.SITENAME = window.process.ENV.GH_SITENAME;
window.BASENAME = window.process.ENV.GH_BASENAME;
window.API_URL = window.process.ENV.GH_API_URL;
window.DEFAULT_INDEX = window.process.ENV.GH_DEFAULT_INDEX;
window.SUGGESTED_TERM = window.process.ENV.GH_SUGGESTED_TERM;
window.ARCHIVE = window.process.ENV.GH_ARCHIVE;
</script>`;

  // Inject right after <head> opens to ensure config is available before scripts
  html = html.replace("<head>", `<head>\n${configScript}`);

  // Basic meta injection (non-destructive): add tags near head end
  const metaBlock = [
    titleText ? `<title>${escapeHtml(titleText)}</title>` : "",
    descriptionText
      ? `<meta name="description" content="${escapeHtml(descriptionText)}">`
      : "",
    `<link rel="canonical" href="${escapeHtml(reqPath)}">`,
  ]
    .filter(Boolean)
    .join("\n");

  html = html.replace("</head>", `${metaBlock}\n</head>`);

  // Replace root placeholder with SSR content container so crawlers see text
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><div id="ssr-content">${ssrHtml}</div></div>`,
  );
  return html;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Serve static built assets (don't send 404, let unmatched paths fall through)
app.use(
  BASE_PATH,
  express.static(BUILD_DIR, {
    maxAge: "1y",
    index: false,
    // Return a 204 No Content for assets that don't exist instead of 404
    // This allows the catch-all route to handle them
    setHeaders: (res, filePath) => {
      res.set("Cache-Control", "public, max-age=31536000, immutable");
    },
  }),
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Runtime config endpoint (available to client-side code)
app.get("/api/config", (req, res) => {
  res.status(200).json(runtimeConfig);
});

// Markdown fetch endpoint for SPA client-side navigation
// Allows dynamic markdown from mounted content directory to be served to the browser
app.get("/api/markdown/*", async (req, res) => {
  try {
    const filePath = req.params[0]; // e.g., "projects/DTOL"
    console.log(`[API] Markdown request for: ${filePath}`);
    const mdPath = resolveMarkdownPath(`/${filePath}`);

    if (mdPath) {
      console.log(`[API] Resolved to file: ${mdPath}`);
      let content = fs.readFileSync(mdPath, "utf8");

      // Rewrite image paths to use the API endpoint
      // Images like /static/images/... → /api/images/...
      // This ensures images are served from the mounted content directory
      content = content.replace(
        /!\[([^\]]*)\]\(\/static\/([^)]+)\)/g,
        (match, alt, path) => {
          return `![${alt}](/api/images/${path})`;
        },
      );

      res.status(200).type("text/plain").send(content);
    } else {
      console.log(`[API] File not found for: ${filePath}`);
      res
        .status(404)
        .json({ error: "Markdown file not found", path: filePath });
    }
  } catch (err) {
    console.error("Markdown fetch error:", err);
    res.status(500).json({ error: "Failed to fetch markdown" });
  }
});

// Image fetch endpoint for markdown content images
// Serves images from the mounted content directory
app.get("/api/images/*", async (req, res) => {
  try {
    const filePath = req.params[0]; // e.g., "images/DToL_Logo_with_text.png"
    console.log(`[API] Image request for: ${filePath}`);

    // Security: prevent directory traversal attacks
    if (filePath.includes("..")) {
      return res.status(400).json({ error: "Invalid path" });
    }

    const imagePath = path.join(CONTENT_ROOT, filePath);

    // Verify the image is within CONTENT_ROOT
    if (!imagePath.startsWith(CONTENT_ROOT)) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (fs.existsSync(imagePath) && fs.statSync(imagePath).isFile()) {
      console.log(`[API] Serving image from: ${imagePath}`);
      res.status(200).sendFile(imagePath);
    } else {
      console.log(`[API] Image not found: ${imagePath}`);
      res.status(404).json({ error: "Image not found", path: filePath });
    }
  } catch (err) {
    console.error("Image fetch error:", err);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

// Markdown SSR + SPA route: serve SSR + SPA for any non-asset path
app.get("*", async (req, res) => {
  try {
    const wantsSSR = SSR_MODE === "all" || (SSR_MODE === "bots" && isBot(req));
    const mdPath = resolveMarkdownPath(req.path);

    // Debug logging
    if (process.env.DEBUG_SSR) {
      console.log(
        `[SSR] Path: ${req.path}, Found: ${mdPath ? "yes" : "no"}, WantsSSR: ${wantsSSR}`,
      );
    }

    if (wantsSSR && mdPath) {
      const md = fs.readFileSync(mdPath, "utf8");
      const ssrHtml = await renderMarkdownToHtml(md);

      // Derive simple title/description heuristically
      const firstHeading = (md.match(/^#\s+(.+)$/m) || [null, null])[1];
      const description = md
        .replace(/^#.+$/m, "")
        .replace(/`{1,3}[^`]*`/g, " ")
        .replace(/\*|_/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 300);

      const page = injectIntoIndexHtml(
        ssrHtml,
        req.originalUrl,
        firstHeading,
        description,
      );
      res.status(200).send(page);
      return;
    }

    // Fallback: serve SPA index.html with runtime config injected EARLY
    let page = indexHtml;
    const configScript = `<script>
  window.process = window.process || {};
  window.process.ENV = ${JSON.stringify(runtimeConfig)};
  // Map to webpack DefinePlugin-style globals for compatibility
  window.SITENAME = window.process.ENV.GH_SITENAME;
  window.BASENAME = window.process.ENV.GH_BASENAME;
  window.API_URL = window.process.ENV.GH_API_URL;
  window.DEFAULT_INDEX = window.process.ENV.GH_DEFAULT_INDEX;
  window.SUGGESTED_TERM = window.process.ENV.GH_SUGGESTED_TERM;
  window.ARCHIVE = window.process.ENV.GH_ARCHIVE;
  </script>`;
    page = page.replace("<head>", `<head>\n${configScript}`);
    res.status(200).send(page);
  } catch (err) {
    console.error("SSR error", err);
    res.status(500).send(indexHtml);
  }
});

app.listen(PORT, () => {
  console.log(
    `GenomeHubs UI SSR server listening on port ${PORT}, base path ${BASE_PATH}`,
  );
  console.log(`Serving built assets from ${BUILD_DIR}`);
  console.log(`Markdown content root: ${CONTENT_ROOT}`);
  console.log(`SSR Mode: ${SSR_MODE}`);
  console.log(`Runtime config:`, runtimeConfig);
});
