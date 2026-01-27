/*
 Minimal Node SSR server for GenomeHubs UI
 - Serves built SPA assets from dist/public
 - Pre-renders markdown files from a mounted content directory for SEO
 - Keeps SPA behavior: includes bundle scripts to hydrate client-side
*/

const path = require("path");
const fs = require("fs");
const express = require("express");
const { spawnSync } = require("child_process");
const os = require("os");
const crypto = require("crypto");
// Handle ESM modules imported via CommonJS require()
function esm(mod) {
  return mod && mod.default ? mod.default : mod;
}

// `unified` is ESM-only in some installs; load it dynamically when needed.
let _unified = null;
async function getUnified() {
  if (_unified) return _unified;
  try {
    const mod = await import("unified");
    _unified = mod.unified || mod.default || mod;
    return _unified;
  } catch (e) {
    // rethrow with clearer message
    throw new Error(
      "Failed to import 'unified' dynamically: " + (e && e.message),
    );
  }
}
const { file } = require("jszip");

// Dynamically import remark/rehype plugins (they may be ESM-only)
let _remarkPlugins = null;
async function getRemarkPlugins() {
  if (_remarkPlugins) return _remarkPlugins;
  try {
    const [rpMod, gfmMod, rehypeMod, rawMod, stringifyMod] = await Promise.all([
      import("remark-parse"),
      import("remark-gfm"),
      import("remark-rehype"),
      import("rehype-raw"),
      import("rehype-stringify"),
    ]);
    _remarkPlugins = {
      remarkParse: rpMod.default || rpMod,
      remarkGfm: gfmMod.default || gfmMod,
      remarkRehype: rehypeMod.default || rehypeMod,
      rehypeRaw: rawMod.default || rawMod,
      rehypeStringify: stringifyMod.default || stringifyMod,
    };
    return _remarkPlugins;
  } catch (e) {
    throw new Error(
      "Failed to import remark/rehype plugins: " + (e && e.message),
    );
  }
}

const app = express();

// Runtime configuration from environment variables
// Maps to window.process.ENV.* in client-side reducers
const runtimeConfig = {
  // From location.js
  GH_SITENAME: process.env.GH_SITENAME || "Demo GenomeHub",
  GH_SITENAME_LONG: process.env.GH_SITENAME_LONG || "", // optional long display name
  GH_BASENAME: process.env.GH_BASENAME || "/",
  // Citation
  GH_CITATION_URL: process.env.GH_CITATION_URL || "",
  // From api.js
  GH_API_URL: process.env.GH_API_URL || "http://localhost:3000/api/v2",
  // From search.js
  GH_DEFAULT_INDEX: process.env.GH_DEFAULT_INDEX || "taxon",
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
// Prefer explicit BASE_PATH, otherwise derive from GH_BASENAME
const DERIVED_BASE = (
  "/" + String(process.env.GH_BASENAME || "").replace(/^\/+|\/+$/g, "")
).replace(/\/$/, "");
const BASE_PATH = process.env.BASE_PATH || DERIVED_BASE || "/"; // e.g. "/archive" or "/"

// Capture originals so we can still print important startup logs even when
// debug logs are silenced. Set `DEBUG_LOGS=1` to enable all console output.
const __orig_console = {
  log: console.log.bind(console),
  info: console.info ? console.info.bind(console) : console.log.bind(console),
  warn: console.warn ? console.warn.bind(console) : console.log.bind(console),
};

// By default, silence non-error console output so debug logs do not
// clutter production runs.
if (!process.env.DEBUG_LOGS) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
}

// Still print the essential server startup line using the captured original
__orig_console.log(
  `[server startup] GH_BASENAME="${process.env.GH_BASENAME}", DERIVED_BASE="${DERIVED_BASE}", BASE_PATH="${BASE_PATH}"`,
);
const BUILD_DIR = path.resolve(__dirname, "../../dist/public");
const INDEX_HTML_PATH = path.join(BUILD_DIR, "index.html");
const CONTENT_ROOT = (process.env.CONTENT_ROOT || "/content") + "/static"; // mount external markdown repo here
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

// If OG renderer is not configured, provide a simple 404 handler for OG
// image requests so they don't fall through to the SPA index.html and
// return HTML (which breaks consumers expecting an image).
if (!process.env.OG_RENDERER_URL) {
  app.get(`${BASE_PATH.replace(/\/$/, "")}/assets/og-image/*`, (req, res) => {
    res.status(404).send("OG renderer disabled");
  });
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
    path.join(CONTENT_ROOT, `${clean}`),
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
  const unified = await getUnified();
  const { remarkParse, remarkGfm, remarkRehype, rehypeRaw, rehypeStringify } =
    await getRemarkPlugins();

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
function rewriteAssetUrlsForBasename(html, basename) {
  const prefix = basename && basename !== "/" ? basename : "";

  // Rewrite script src and link href tag attributes to include basename
  // The entry point handles __webpack_public_path__ for dynamic chunks
  let rewritten = html.replace(
    /(<script[^>]*?\s+src)=(["\']?)\/([^\s"\'>\?]*)/g,
    (match, scriptTag, openQuote, path) => {
      if (path.startsWith("http") || path.startsWith("//")) {
        return match; // Skip external URLs
      }
      const closeQuote = openQuote || "";
      return `${scriptTag}=${closeQuote}${prefix ? prefix + "/" + path : "/" + path}${closeQuote}`;
    },
  );

  rewritten = rewritten.replace(
    /(<link[^>]*?\s+href)=(["\']?)\/([^\s"\'>\?]*)/g,
    (match, linkTag, openQuote, path) => {
      if (path.startsWith("http") || path.startsWith("//")) {
        return match; // Skip external URLs
      }
      const closeQuote = openQuote || "";
      return `${linkTag}=${closeQuote}${prefix ? prefix + "/" + path : "/" + path}${closeQuote}`;
    },
  );

  // Also rewrite relative (no-leading-slash) script/link URLs so they don't
  // resolve relative to the current page path (e.g. /projects/ -> /projects/js/...)
  rewritten = rewritten.replace(
    /(<script[^>]*?\s+src)=(['"]?)(?!\/|http|\/\/)([^\s"'>\?]*)/g,
    (match, scriptTag, openQuote, path) => {
      if (path.startsWith("http") || path.startsWith("//")) {
        return match;
      }
      const closeQuote = openQuote || "";
      return `${scriptTag}=${closeQuote}${prefix ? prefix + "/" + path : "/" + path}${closeQuote}`;
    },
  );

  rewritten = rewritten.replace(
    /(<link[^>]*?\s+href)=(['"]?)(?!\/|http|\/\/)([^\s"'>\?]*)/g,
    (match, linkTag, openQuote, path) => {
      if (path.startsWith("http") || path.startsWith("//")) {
        return match;
      }
      const closeQuote = openQuote || "";
      return `${linkTag}=${closeQuote}${prefix ? prefix + "/" + path : "/" + path}${closeQuote}`;
    },
  );

  return rewritten;
}

function injectIntoIndexHtml(
  ssrHtml,
  reqPath,
  titleText = null,
  descriptionText = null,
  ogImageUrl = null,
) {
  let html = indexHtml;

  // Rewrite script/link URLs to include basename
  const basePrefix = BASE_PATH.replace(/\/$/, ""); // e.g., "/archive"
  console.log(
    `[injectIntoIndexHtml] BASE_PATH="${BASE_PATH}", basePrefix="${basePrefix}"`,
  );
  html = rewriteAssetUrlsForBasename(html, basePrefix);

  let customMeta = "";
  const metaPath = path.join(CONTENT_ROOT, "../meta.json");
  try {
    if (fs.existsSync(metaPath)) {
      const metaData = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      const metaTags = [];

      // Process regular meta tags (name/content)
      if (Array.isArray(metaData.meta)) {
        metaTags.push(
          ...metaData.meta.map((attrs) => {
            if (attrs.charset) {
              return `<meta charset="${escapeHtml(attrs.charset)}">`;
            }
            const attrStr = Object.entries(attrs)
              .map(([key, val]) => `${key}="${escapeHtml(String(val))}"`)
              .join(" ");
            return `<meta ${attrStr}>`;
          }),
        );
      }

      // Process meta property tags (og:, twitter:, etc)
      if (Array.isArray(metaData.meta_property)) {
        metaTags.push(
          ...metaData.meta_property.map((attrs) => {
            const attrStr = Object.entries(attrs)
              .map(([key, val]) => `${key}="${escapeHtml(String(val))}"`)
              .join(" ");
            return `<meta ${attrStr}>`;
          }),
        );
      }

      // Process link tags
      if (Array.isArray(metaData.link)) {
        metaTags.push(
          ...metaData.link.map((attrs) => {
            const attrStr = Object.entries(attrs)
              .map(([key, val]) => `${key}="${escapeHtml(String(val))}"`)
              .join(" ");
            return `<link ${attrStr}>`;
          }),
        );
      }

      customMeta = metaTags.join("\n    ");
    }
  } catch (err) {
    console.warn("Could not load meta.json:", err.message);
  }

  // CRITICAL: Set webpack's public path IMMEDIATELY as very first script
  // Inline directly in HTML with NO delays to ensure chunk loading uses correct path
  // Must run before any other JS executes
  const publicPathScript = `<script>
var raw = "${runtimeConfig.GH_BASENAME}" || "";
var clean = String(raw).replace(/^\\/+|\\/+$/g, "");
var basePrefix = clean ? "/" + clean : "";
window.__webpack_public_path__ = basePrefix + "/";
// Also set for webpack 5's internal variable if different
if (typeof __webpack_public_path__ !== 'undefined') {
  __webpack_public_path__ = basePrefix + "/";
}
</script>`;

  // Inject runtime config AFTER public path
  const configScript = `${publicPathScript}
<script>
window.process = window.process || {};
window.process.ENV = ${JSON.stringify(runtimeConfig)};
// Map to webpack DefinePlugin constants for compatibility
window.SITENAME = window.process.ENV.GH_SITENAME;
window.SITENAME_LONG = window.process.ENV.GH_SITENAME_LONG;
window.BASENAME = window.process.ENV.GH_BASENAME;
window.CITATION_URL = window.process.ENV.GH_CITATION_URL;
window.API_URL = window.process.ENV.GH_API_URL;
window.DEFAULT_INDEX = window.process.ENV.GH_DEFAULT_INDEX;
window.SUGGESTED_TERM = window.process.ENV.GH_SUGGESTED_TERM;
window.ARCHIVE = window.process.ENV.GH_ARCHIVE;
</script>
${customMeta}`;

  // Inject right after <head> opens to ensure public path is set FIRST
  html = html.replace("<head>", `<head>\n${configScript}`);

  // Basic meta injection (non-destructive): add tags near head end
  // Sanitize description to remove directive markers and image markdown
  const cleanDescription = sanitizeDescription(descriptionText);

  const metaBlock = [
    titleText ? `<title>${escapeHtml(titleText)}</title>` : "",
    cleanDescription
      ? `<meta name="description" content="${escapeHtml(cleanDescription)}">`
      : "",
    ogImageUrl
      ? `<meta property="og:image" content="${escapeHtml(ogImageUrl)}">`
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

// Extract first report from markdown content.
// Supports fenced code blocks starting with ```report containing YAML,
// and inline <report .../> tags with attributes.
function extractFirstReport(mdContent, currentUrlPath = null, depth = 0) {
  if (!mdContent || depth > 3) return null;

  const yaml = require("js-yaml");

  // helper to interpolate {{var}} in text using vars map
  function interp(text, vars = {}) {
    if (!text) return text;
    return String(text).replace(/{{\s*([^}]+)\s*}}/g, (m, k) => {
      return vars.hasOwnProperty(k) ? String(vars[k]) : "";
    });
  }

  // 1) fenced code block ```report\n...yaml...\n```
  const fenceMatch = mdContent.match(/```report\s*\n([\s\S]*?)\n```/i);
  if (fenceMatch) {
    try {
      const parsed = yaml.load(fenceMatch[1]);
      return parsed || null;
    } catch (err) {
      return null;
    }
  }

  // 2) Search for include directives like ::include{...}
  const includeRe = /::include\{([^}]+)\}/g;
  let incMatch;
  while ((incMatch = includeRe.exec(mdContent))) {
    const rawAttrs = incMatch[1];
    const attrs = {};
    // parse key=value, key="value", or flags like .inline
    const re =
      /(?:\.([a-zA-Z0-9_-]+))|([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s}]+))/g;
    let m;
    while ((m = re.exec(rawAttrs))) {
      if (m[1]) {
        attrs[m[1]] = true;
      } else if (m[2]) {
        attrs[m[2]] = m[3] || m[4] || m[5] || "";
      }
    }

    // If there's a pageId, try to resolve and read that file
    if (attrs.pageId) {
      const pageIdClean = String(attrs.pageId)
        .replace(/\.md$/i, "")
        .replace(/^\s*|\s*$/g, "");
      const includedMdPath = resolveMarkdownPath(pageIdClean);
      if (includedMdPath) {
        try {
          let includedMd = fs.readFileSync(includedMdPath, "utf8");
          // Look for a fenced report inside the included file
          const incFence = includedMd.match(/```report\s*\n([\s\S]*?)\n```/i);
          if (incFence) {
            // interpolate variables from attrs into YAML
            const yamlText = interp(incFence[1], attrs);
            try {
              const parsed = yaml.load(yamlText);
              return parsed || null;
            } catch (err) {
              return null;
            }
          }

          // Recurse into included content to find nested includes/reports
          const nested = extractFirstReport(
            includedMd,
            attrs.pageId,
            depth + 1,
          );
          if (nested) return nested;
        } catch (err) {
          // ignore read errors
        }
      }
    }
  }

  // 3) HTML-style <report attr="value" /> or <report attr='value'></report>
  const tagMatch = mdContent.match(/<report\s+([^>]+?)\s*\/?>/i);
  if (tagMatch) {
    const attrText = tagMatch[1];
    const attrs = {};
    // simple attr parser: key="value" or key='value' or key=value
    const re2 = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^\"]*)"|'([^']*)'|([^\s>]+))/g;
    let mm;
    while ((mm = re2.exec(attrText))) {
      attrs[mm[1]] = mm[2] || mm[3] || mm[4] || "";
    }
    return attrs;
  }

  return null;
}

// Render a minimal SVG snapshot for a report using its properties.
function renderReportToSVG(reportProps) {
  if (!reportProps) return null;
  const title = escapeHtml(
    String(reportProps.title || reportProps.report || "Report"),
  );
  const caption = escapeHtml(String(reportProps.caption || ""));
  const id = escapeHtml(String(reportProps.report || reportProps.id || ""));

  const width = 1200;
  const height = 630;
  const padding = 48;
  const titleY = 120;
  const captionY = 200;

  return (svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" x2="1">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#0b2545" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)" />
  <g fill="#fff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <text x="${padding}" y="${titleY}" font-size="48" font-weight="700">${title}</text>
    <text x="${padding}" y="${captionY}" font-size="28" fill="#e6eef8">${caption}</text>
    <text x="${padding}" y="${height - 48}" font-size="18" fill="#9fb6d9">${id}</text>
  </g>
</svg>`);
}

// OG image endpoint: generate a simple SVG snapshot for the first report on the page
// Only register this endpoint when OG_RENDERER_URL is set in the environment
if (process.env.OG_RENDERER_URL) {
  app.get(
    `${BASE_PATH.replace(/\/$/, "")}/assets/og-image/*`,
    async (req, res) => {
      try {
        const filePath = req.params[0]; // e.g., "projects/DTOL"
        const mdPath = resolveMarkdownPath(`/${filePath}`);
        if (!mdPath) return res.status(404).send("Not Found");

        // Read markdown early so we can detect embedded reports or includes
        const md = fs.readFileSync(mdPath, "utf8");

        // If configured, try a lightweight renderer (wkhtmltoimage) first,
        // then Puppeteer as a fallback. Control with `OG_RENDERER` env:
        // - "wkhtmltoimage" to force wkhtmltoimage
        // - "puppeteer" to force puppeteer
        // - "auto" to prefer wkhtmltoimage then puppeteer
        const renderer = (process.env.OG_RENDERER || "auto").toLowerCase();
        const REMOTE_RENDERER_URL = process.env.OG_RENDERER_URL || null;
        const tryWkhtml = renderer === "wkhtmltoimage" || renderer === "auto";
        const tryPuppeteer = renderer === "puppeteer" || renderer === "auto";
        const tryRemote =
          (renderer === "remote" || renderer === "auto") &&
          !!REMOTE_RENDERER_URL;

        // Helper: attempt to render URL to PNG using wkhtmltoimage binary
        async function tryWkhtmltoimage(url) {
          try {
            const which = spawnSync("which", ["wkhtmltoimage"]);
            if (which.status !== 0) return null;
            const tmpName = path.join(
              os.tmpdir(),
              `og-${crypto.randomBytes(8).toString("hex")}.png`,
            );
            // Use reasonable size for social previews
            const args = ["--width", "1200", "--height", "630", url, tmpName];
            const res = spawnSync("wkhtmltoimage", args, { timeout: 20000 });
            if (res.status !== 0) {
              console.warn(
                "wkhtmltoimage failed",
                res.stderr && res.stderr.toString(),
              );
              try {
                if (fs.existsSync(tmpName)) fs.unlinkSync(tmpName);
              } catch (e) {}
              return null;
            }
            const buffer = fs.readFileSync(tmpName);
            try {
              fs.unlinkSync(tmpName);
            } catch (e) {}
            return buffer;
          } catch (err) {
            console.warn("wkhtmltoimage error:", err && err.message);
            return null;
          }
        }

        // Helper: attempt to render via a remote renderer service (browserless-like)
        async function tryRemoteRenderer(url) {
          if (!REMOTE_RENDERER_URL) return null;
          const full =
            REMOTE_RENDERER_URL.replace(/\/$/, "") +
            "/screenshot?url=" +
            encodeURIComponent(url) +
            "&width=1200&height=630";
          const alt =
            REMOTE_RENDERER_URL.replace(/\/$/, "") +
            "?url=" +
            encodeURIComponent(url) +
            "&width=1200&height=630";
          const { request } = require("http");
          const { request: requestHttps } = require("https");
          const tryUrl = async (u) => {
            try {
              const parsed = new URL(u);
              const lib = parsed.protocol === "https:" ? requestHttps : request;
              return await new Promise((resolve) => {
                const req = lib(u, { method: "GET", timeout: 15000 }, (res) => {
                  const chunks = [];
                  res.on("data", (c) => chunks.push(c));
                  res.on("end", () => {
                    const buf = Buffer.concat(chunks);
                    const ct = (
                      res.headers["content-type"] || ""
                    ).toLowerCase();
                    if (
                      res.statusCode >= 200 &&
                      res.statusCode < 300 &&
                      ct.startsWith("image/")
                    ) {
                      resolve(buf);
                    } else if (
                      res.statusCode >= 200 &&
                      res.statusCode < 300 &&
                      ct.includes("json")
                    ) {
                      try {
                        const obj = JSON.parse(buf.toString());
                        if (obj && obj.data) {
                          // assume base64
                          try {
                            resolve(Buffer.from(obj.data, "base64"));
                          } catch (e) {
                            resolve(null);
                          }
                        } else resolve(null);
                      } catch (e) {
                        resolve(null);
                      }
                    } else {
                      resolve(null);
                    }
                  });
                });
                req.on("error", () => resolve(null));
                req.on("timeout", () => {
                  try {
                    req.destroy();
                  } catch (e) {}
                  resolve(null);
                });
                req.end();
              });
            } catch (e) {
              return null;
            }
          };

          // Try /screenshot endpoint then fallback to root-style
          let out = await tryUrl(full);
          if (out) return out;
          out = await tryUrl(alt);
          return out;
        }

        // Determine rendering target: if the markdown (or its includes) define a report,
        // render the dedicated `/report?...` page instead of the project page.
        const report = extractFirstReport(md, `/${filePath}`);
        const base = BASE_PATH.replace(/\/$/, "");
        let pagePath;
        if (report) {
          // Build query string from report object; arrays become comma-joined
          const urlParams = new URLSearchParams();
          for (const [k, v] of Object.entries(report)) {
            if (v === undefined || v === null) continue;
            if (Array.isArray(v)) urlParams.set(k, v.join(","));
            else urlParams.set(k, String(v));
          }
          pagePath = `${base}/report?${urlParams.toString()}`;
          console.log(
            `[og-image] generated report pagePath=${pagePath} from ${filePath}`,
          );
        } else {
          pagePath = `${base}/${filePath}`.replace(/\/+/g, "/");
          console.log(`[og-image] no report found; using pagePath=${pagePath}`);
        }

        // If configured to try remote renderer, attempt it first
        if (tryRemote) {
          try {
            const url = `${req.protocol}://${req.get("host")}${pagePath}`;
            console.log(
              `[og-image] attempting remote renderer url=${url} -> ${REMOTE_RENDERER_URL}`,
            );
            const buf = await tryRemoteRenderer(url);
            if (buf) {
              res.set("Content-Type", "image/png");
              res.set("Cache-Control", "public, max-age=86400");
              res.status(200).send(buf);
              return;
            }
          } catch (e) {
            console.warn("remote renderer attempt failed:", e && e.message);
          }
        }

        // If configured to try wkhtmltoimage, attempt it first
        if (tryWkhtml) {
          try {
            const url = `${req.protocol}://${req.get("host")}${pagePath}`;
            console.log(
              `[og-image] attempting wkhtmltoimage render url=${url}`,
            );
            const buf = await tryWkhtmltoimage(url);
            if (buf) {
              res.set("Content-Type", "image/png");
              res.set("Cache-Control", "public, max-age=86400");
              res.status(200).send(buf);
              return;
            }
          } catch (e) {
            console.warn("wkhtmltoimage attempt failed:", e && e.message);
          }
        }

        // If configured, try to render the full page with Puppeteer for an accurate
        // visual rendering of the report. Enable with `OG_RENDERER=puppeteer` or "auto".
        const usePuppeteer = tryPuppeteer;
        if (usePuppeteer) {
          let puppeteer = null;
          try {
            // prefer puppeteer if installed
            puppeteer = require("puppeteer");
          } catch (err) {
            try {
              puppeteer = require("puppeteer-core");
            } catch (err2) {
              puppeteer = null;
            }
          }

          if (puppeteer) {
            let browser = null;
            try {
              browser = await puppeteer.launch({
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
              });
              const page = await browser.newPage();
              // Use a deviceScaleFactor of 2 so generated PNGs are high-DPI
              // (crisper on HiDPI screens). Puppeteer will scale screenshots
              // appropriately when this is set.
              await page.setViewport({
                width: 1200,
                height: 667,
                deviceScaleFactor: 2,
              });
              // Mark downstream API/cache calls as renderer requests so the API can skip caching
              try {
                await page.setExtraHTTPHeaders({ "X-OG-RENDER": "1" });
              } catch (e) {}

              // Derive an API origin accessible from the Puppeteer process.
              // Priority:
              // 1) `PUPPETEER_API_ORIGIN` env (explicit override)
              // 2) origin of `GH_API_URL` if set
              // 3) when running inside Docker, prefer `host.docker.internal:3000`
              // 4) fall back to `http://localhost:3000`
              let apiOrigin = "http://localhost:3000";
              try {
                if (process.env.PUPPETEER_API_ORIGIN) {
                  apiOrigin = process.env.PUPPETEER_API_ORIGIN;
                } else {
                  const raw =
                    process.env.GH_API_URL || "http://localhost:3000/api/v2";
                  try {
                    apiOrigin = new URL(raw).origin;
                  } catch (e) {
                    // keep default
                  }
                }

                // If the derived origin is localhost and we appear to be inside
                // a Docker container, try host.docker.internal which maps to the
                // host's loopback on Docker for Mac/Windows and recent Docker versions.
                if (
                  apiOrigin.includes("localhost") ||
                  apiOrigin.includes("127.0.0.1")
                ) {
                  try {
                    const fs = require("fs");
                    if (
                      fs.existsSync("/.dockerenv") ||
                      fs.existsSync("/run/.containerenv")
                    ) {
                      apiOrigin = "http://host.docker.internal:3000";
                    }
                  } catch (e) {
                    // ignore
                  }
                }
              } catch (e) {}

              // Enable request interception so we can rewrite requests that would
              // otherwise attempt to reach 'localhost:3000' from inside the renderer
              // (which often resolves to the renderer container itself).
              try {
                await page.setRequestInterception(true);
                page.on("request", (reqEv) => {
                  try {
                    const u = reqEv.url();
                    let parsed;
                    try {
                      parsed = new URL(u);
                    } catch (e) {
                      // If URL parsing fails, don't attempt to rewrite
                      parsed = null;
                    }
                    // Only rewrite requests whose pathname clearly targets the API
                    // (e.g. /api/...), to avoid accidentally routing JS/assets
                    // to the API origin which would return HTML.
                    const shouldRewrite =
                      parsed &&
                      parsed.pathname &&
                      parsed.pathname.startsWith("/api");
                    if (shouldRewrite) {
                      let newUrl = u;
                      try {
                        if (parsed.origin !== apiOrigin) {
                          newUrl = u.replace(parsed.origin, apiOrigin);
                        }
                      } catch (e) {
                        // ignore URL replace failures
                      }
                      console.log(
                        `[og-image][puppeteer][request] ${reqEv.method()} ${u}${newUrl !== u ? ` -> ${newUrl}` : ""}`,
                      );
                      try {
                        reqEv.continue({ url: newUrl });
                        return;
                      } catch (e) {
                        // fall through
                      }
                    }
                  } catch (e) {
                    // swallow
                  }
                  try {
                    reqEv.continue();
                  } catch (e) {
                    try {
                      reqEv.abort();
                    } catch (e2) {}
                  }
                });

                page.on("response", async (resp) => {
                  try {
                    const u = resp.url();
                    // Log API responses (short-circuit) as before
                    let parsed;
                    try {
                      parsed = new URL(u);
                    } catch (e) {
                      parsed = null;
                    }
                    if (
                      parsed &&
                      parsed.pathname &&
                      parsed.pathname.startsWith("/api")
                    ) {
                      const status = resp.status();
                      let text = "";
                      try {
                        text = await resp.text();
                        if (text && text.length > 800)
                          text = text.slice(0, 800) + "...";
                      } catch (e) {}
                      console.log(
                        `[og-image][puppeteer][response] ${status} ${u} ${text}`,
                      );
                      return;
                    }

                    // Extra debug: detect when a script request returns HTML which
                    // causes "Unexpected token '<'" in JSON/script parsing.
                    try {
                      const ct =
                        (resp.headers && resp.headers()["content-type"]) ||
                        (resp.headers && resp.headers()["content-type"]);
                      const isScript =
                        resp.request &&
                        resp.request().resourceType &&
                        resp.request().resourceType() === "script";
                      if (
                        isScript &&
                        ct &&
                        ct.toLowerCase().includes("text/html")
                      ) {
                        console.warn(
                          `[og-image][puppeteer][response-warning] script ${u} returned HTML (content-type=${ct})`,
                        );
                      }
                    } catch (e) {}
                  } catch (e) {}
                });

                page.on("requestfailed", (rf) => {
                  try {
                    const u = rf.url();
                    if (u.includes("/api/")) {
                      console.log(
                        `[og-image][puppeteer][requestfailed] ${rf.failure().errorText} ${u}`,
                      );
                    }
                  } catch (e) {}
                });
              } catch (e) {}

              // Convert report URLs to search URLs (CI test behaviour) so the
              // client-side selectors used by the tests are present. Parse the
              // raw query string and re-encode param values to avoid invalid
              // characters breaking navigation.
              let renderPath = pagePath;
              try {
                const qs = require("querystring");
                const raw = String(pagePath || "");
                const idx = raw.indexOf("?");
                const base = idx === -1 ? raw : raw.slice(0, idx);
                const rawQs = idx === -1 ? "" : raw.slice(idx + 1);
                const params = qs.parse(rawQs);
                // Support CI behaviour: move `x` -> `query`
                if (params.x && !params.query) {
                  params.query = params.x;
                  delete params.x;
                }
                // Ensure a sensible default for `result` so the search view
                // renders the expected table/report. Default to `taxon` when
                // not provided.
                if (!params.result) params.result = "taxon";
                // Standardize scatter plot point size to produce consistent OG images.
                if (params.report === "scatter") {
                  if (!params.pointSize) params.pointSize = "15";
                }
                // Build encoded query string using encodeURIComponent for values
                const pairs = Object.keys(params).map((k) => {
                  let v = params[k];
                  // normalize arrays to comma-separated
                  if (Array.isArray(v)) v = v.join(",");
                  const rawVal = String(v);
                  // encodeURIComponent leaves () and * unescaped; ensure they are percent-encoded
                  let ev = encodeURIComponent(rawVal)
                    .replace(/\+/g, "%20")
                    .replace(/\(/g, "%28")
                    .replace(/\)/g, "%29")
                    .replace(/\*/g, "%2A");
                  return `${encodeURIComponent(k)}=${ev}`;
                });
                const newQs = pairs.join("&");
                const newBase = base
                  .replace(/\/report$/, "/search")
                  .replace(/\/report\/?$/, "/search");
                renderPath = newQs ? `${newBase}?${newQs}` : newBase;
              } catch (e) {
                // fallback to simple replace
                try {
                  renderPath = String(pagePath)
                    .replace(/\/report\?/, "/search?")
                    .replace(/\bx=/, "query=");
                } catch (e2) {}
              }
              const url = `${req.protocol}://${req.get("host")}${renderPath}`;
              console.log(
                `[og-image] attempting puppeteer render url=${url} (converted from ${pagePath})`,
              );

              // Inspect query params to decide if Puppeteer should be used.
              try {
                const parsed = new URL(url);
                const rp = parsed.searchParams.get("report");
                const treeStyle = parsed.searchParams.get("treeStyle");
                // Skip non-ring trees (they render to canvas) and `xperrank` which
                // also does not produce SVG output. If we have a parsed `report`
                // object from the markdown, prefer the server-side SVG fallback.
                if (rp === "tree" && treeStyle !== "ring") {
                  console.log(
                    "[og-image] skipping puppeteer for non-ring tree reports; using SVG fallback if available",
                  );
                  if (report) {
                    const svg = renderReportToSVG(report);
                    res.set("Content-Type", "image/svg+xml");
                    res.set("Cache-Control", "public, max-age=86400");
                    res.status(200).send(svg);
                    try {
                      await browser.close();
                    } catch (e) {}
                    return;
                  }
                }
                if (rp === "xperrank") {
                  console.log(
                    "[og-image] skipping puppeteer for xperrank reports; using SVG fallback if available",
                  );
                  if (report) {
                    const svg = renderReportToSVG(report);
                    res.set("Content-Type", "image/svg+xml");
                    res.set("Cache-Control", "public, max-age=86400");
                    res.status(200).send(svg);
                    try {
                      await browser.close();
                    } catch (e) {}
                    return;
                  }
                }
              } catch (e) {
                // If URL parsing fails, continue with Puppeteer as before
              }

              await page.goto(url, {
                waitUntil: "networkidle2",
                timeout: 20000,
              });
              // Wait for client-side readiness signal set by ReportItem (`data-og-ready="1"`).
              // Fall back after 5s if the signal isn't present to avoid hanging.
              try {
                await page.waitForFunction(
                  () => {
                    try {
                      return (
                        typeof document !== "undefined" &&
                        document.body &&
                        document.body.getAttribute("data-og-ready") === "1"
                      );
                    } catch (e) {
                      return false;
                    }
                  },
                  { timeout: 5000 },
                );
                console.log(
                  `[og-image] detected client readiness on ${pagePath}`,
                );
              } catch (e) {
                console.log(
                  `[og-image] client readiness not detected on ${pagePath}; continuing with screenshot`,
                );
              }

              // Additional waits for specific report types that render complex
              // SVGs asynchronously (eg. scatter plots). This helps avoid
              // intermittent captures where only the caption appears.
              try {
                const parsedUrl = new URL(url);
                const rp = parsedUrl.searchParams.get("report");
                if (rp === "scatter") {
                  try {
                    await page.waitForSelector(
                      "#report-panel svg.recharts-surface",
                      { timeout: 5000 },
                    );
                    await page.waitForFunction(
                      () => {
                        try {
                          const svg = document.querySelector(
                            "#report-panel svg.recharts-surface",
                          );
                          if (!svg) return false;
                          const pts = svg.querySelectorAll(
                            "circle, path.recharts-dot",
                          );
                          if (pts && pts.length > 0) return true;
                          const r = svg.getBoundingClientRect();
                          return r && r.width * r.height > 10000;
                        } catch (e) {
                          return false;
                        }
                      },
                      { timeout: 5000 },
                    );
                    console.log(
                      "[og-image] scatter plot appears to be rendered",
                    );
                  } catch (e) {
                    console.log(
                      "[og-image] scatter-specific render wait timed out, continuing",
                    );
                  }
                }
              } catch (e) {
                // ignore URL/parse errors and continue
              }

              // Try to focus and capture the report element used by the UI tests
              // (see tests/integration_tests/ui/test-ui.mjs). If the report element
              // is not present, fall back to capturing the search results table.
              let buffer = null;
              try {
                // Prefer report panel used by client-side renderers
                try {
                  await page.waitForSelector("#report-panel", {
                    timeout: 3000,
                  });
                  await page.$eval("#report-panel", (el) =>
                    el.scrollIntoView(),
                  );
                } catch (e) {
                  // ignore if not present
                }

                try {
                  await page.waitForSelector("#report-loaded", {
                    timeout: 3000,
                  });
                  // give a short moment for canvas/svg rendering to settle
                  await page.waitForTimeout(250);
                  // // Additional arbitrary wait to allow complex reports (eg. trees)
                  // // finish loading in headless mode. This helps determine whether
                  // // timing is the issue or if rendering is fundamentally broken.
                  // console.log(
                  //   "[og-image] waiting extra 5000ms for report to finish loading (debug)",
                  // );
                  // await page.waitForTimeout(5000);
                } catch (e) {
                  // continue - marker not present
                }

                // Wait for a sizable report element to appear (avoid picking up
                // small icons or placeholders). Use a short timeout so OG
                // generation doesn't hang; fallback to panel/table capture below.
                try {
                  await page.waitForFunction(
                    () => {
                      try {
                        const el = document.querySelector(
                          "#report-panel svg, #report-panel canvas, #report-panel .report-root",
                        );
                        if (!el) return false;
                        const r = el.getBoundingClientRect();
                        return r && r.width * r.height > 4000; // area threshold
                      } catch (e) {
                        return false;
                      }
                    },
                    { timeout: 3000 },
                  );
                  // center the element in viewport for consistent rendering
                  try {
                    await page.$eval("#report-panel", (el) =>
                      el.scrollIntoView({ block: "center", inline: "center" }),
                    );
                  } catch (e) {}
                } catch (e) {
                  // didn't find a large element in time; we'll fall back later
                }

                // Find the best element to capture inside #report-panel. Select
                // svg first (preferred), otherwise canvas/.report-root, or the
                // panel itself. Choose the largest bounding box to avoid icons.
                let bestBox = null;
                try {
                  // Debug: collect a short summary of nodes inside #report-panel
                  // so we can see what the client has rendered when Puppeteer runs.
                  try {
                    const panelSummary = await page.evaluate(() => {
                      const panel = document.querySelector("#report-panel");
                      if (!panel) return null;
                      const nodes = Array.from(
                        panel.querySelectorAll("svg, canvas, .report-root, *"),
                      ).slice(0, 50);
                      return nodes.map((n) => {
                        const r = n.getBoundingClientRect
                          ? n.getBoundingClientRect()
                          : { x: 0, y: 0, width: 0, height: 0 };
                        return {
                          tag: n.tagName,
                          id: n.id || null,
                          class: n.className ? String(n.className) : null,
                          bbox: {
                            x: Math.round(r.x),
                            y: Math.round(r.y),
                            w: Math.round(r.width),
                            h: Math.round(r.height),
                          },
                          text: (n.textContent || "").slice(0, 200),
                          outer: (n.outerHTML || "").slice(0, 200),
                        };
                      });
                    });
                    if (panelSummary) {
                      try {
                        console.log(
                          "[og-image][debug][report-panel] " +
                            JSON.stringify(panelSummary),
                        );
                      } catch (e) {
                        console.log(
                          "[og-image][debug][report-panel] (could not stringify panel summary)",
                        );
                      }
                    } else {
                      console.log("[og-image][debug][report-panel] not found");
                    }
                  } catch (e) {
                    console.log(
                      "[og-image][debug][report-panel] evaluate failed",
                      e && e.message,
                    );
                  }

                  // SVG-first capture: try to find the largest <svg> and screenshot it.
                  try {
                    const svgEls = await page.$$("#report-panel svg");
                    if (svgEls && svgEls.length > 0) {
                      let bestSvg = null;
                      let bestArea = 0;
                      for (const s of svgEls) {
                        try {
                          const b = await s.boundingBox();
                          if (b && b.width > 0 && b.height > 0) {
                            const area = b.width * b.height;
                            if (area > bestArea) {
                              bestArea = area;
                              bestSvg = s;
                            }
                          }
                        } catch (e) {}
                      }
                      if (bestSvg) {
                        try {
                          const svgBuffer = await bestSvg.screenshot({
                            type: "png",
                          });
                          console.log(
                            "[og-image] captured svg element via element.screenshot()",
                          );
                          buffer = svgBuffer;
                        } catch (e) {
                          console.log(
                            "[og-image] svg element.screenshot failed, will fall back to panel capture",
                            e && e.message,
                          );
                        }
                      }
                    }
                  } catch (e) {
                    // ignore svg-specific failures and continue to generic flow
                  }

                  // If we didn't capture an SVG, fall back to general candidate search
                  if (!buffer) {
                    const nodeHandles = await page.$$(
                      "#report-panel svg, #report-panel canvas, #report-panel .report-root, #report-panel",
                    );
                    const candidatesList = [];
                    for (const el of nodeHandles) {
                      try {
                        const b = await el.boundingBox();
                        if (b && b.width > 0 && b.height > 0) {
                          const area = b.width * b.height;
                          let tag = null;
                          try {
                            tag = await page.evaluate((n) => n.tagName, el);
                          } catch (e) {}
                          candidatesList.push({ box: b, area, el, tag });
                          if (!bestBox || area > bestBox.area) {
                            bestBox = { box: b, area, el, tag };
                          }
                        }
                      } catch (e) {
                        // ignore element if boundingBox fails
                      }
                    }

                    // If the best candidate is a canvas (likely a tree), prefer the
                    // largest non-canvas candidate (svg/.report-root) if available.
                    try {
                      if (bestBox && bestBox.tag === "CANVAS") {
                        const alt = candidatesList
                          .filter((c) => c.tag !== "CANVAS")
                          .sort((a, b) => b.area - a.area)[0];
                        if (alt) {
                          console.log(
                            "[og-image] skipping canvas/tree element; using alternative element instead",
                          );
                          bestBox = alt;
                        }
                      }
                    } catch (e) {}
                  }
                } catch (e) {
                  // ignore overall candidate selection failures
                }

                if (bestBox && bestBox.box) {
                  const { box } = bestBox;
                  // If the chosen box is very small (likely an icon), prefer the
                  // full panel bbox instead if available.
                  if (box.width < 100 || box.height < 100) {
                    try {
                      const panel = await page.$("#report-panel");
                      if (panel) {
                        const pb = await panel.boundingBox();
                        if (pb && pb.width > 0 && pb.height > 0) {
                          bestBox.box = pb;
                          console.log(
                            "[og-image] small report element detected; using panel bbox instead",
                          );
                        }
                      }
                    } catch (e) {}
                  }

                  const b = bestBox.box;
                  const vw = 1200;
                  const vh = 667;
                  const clip = {
                    x: Math.max(0, b.x),
                    y: Math.max(0, b.y),
                    width: Math.min(b.width, vw - Math.max(0, b.x)),
                    height: Math.min(b.height, vh - Math.max(0, b.y)),
                  };
                  try {
                    // Prefer element screenshot which handles scrolled/positioned
                    // children (canvas inside positioned containers).
                    if (
                      bestBox.el &&
                      typeof bestBox.el.screenshot === "function"
                    ) {
                      try {
                        buffer = await bestBox.el.screenshot({ type: "png" });
                        console.log(
                          "[og-image] captured report element via element.screenshot()",
                        );
                      } catch (e) {
                        console.log(
                          "[og-image] element.screenshot failed, falling back to clip",
                          e && e.message,
                        );
                        buffer = await page.screenshot({ type: "png", clip });
                        console.log(
                          `[og-image] captured report element clip ${JSON.stringify(clip)}`,
                        );
                      }
                    } else {
                      buffer = await page.screenshot({ type: "png", clip });
                      console.log(
                        `[og-image] captured report element clip ${JSON.stringify(clip)}`,
                      );
                    }
                  } catch (e) {
                    console.log(
                      "[og-image] clip screenshot failed, falling back",
                      e && e.message,
                    );
                  }
                }

                // Fallback: capture the search results table or the top of the page
                if (!buffer) {
                  const tableEl =
                    (await page.$("#search-results")) ||
                    (await page.$(".search-results")) ||
                    (await page.$("table"));
                  if (tableEl) {
                    const box = await tableEl.boundingBox();
                    if (box && box.width > 0 && box.height > 0) {
                      const vw = 1200;
                      const vh = 667;
                      const clip = {
                        x: Math.max(0, box.x),
                        y: Math.max(0, box.y),
                        width: Math.min(box.width, vw - Math.max(0, box.x)),
                        height: Math.min(box.height, vh - Math.max(0, box.y)),
                      };
                      try {
                        buffer = await page.screenshot({ type: "png", clip });
                        console.log(
                          `[og-image] captured table element clip ${JSON.stringify(clip)}`,
                        );
                      } catch (e) {
                        console.log(
                          "[og-image] table clip screenshot failed, falling back",
                          e && e.message,
                        );
                      }
                    }
                  }
                }

                // Final fallback: non-fullpage screenshot of the viewport
                if (!buffer) {
                  buffer = await page.screenshot({
                    type: "png",
                    fullPage: false,
                  });
                  console.log("[og-image] fallback viewport screenshot taken");
                }
              } catch (e) {
                console.log(
                  "[og-image] screenshot flow failed, taking full-page fallback",
                  e && e.message,
                );
                try {
                  buffer = await page.screenshot({
                    type: "png",
                    fullPage: false,
                  });
                } catch (e2) {
                  console.error(
                    "[og-image] final screenshot attempt failed:",
                    e2,
                  );
                }
              }

              console.log(
                `[og-image] render succeeded via puppeteer for ${pagePath}`,
              );

              // Composite fallback using Puppeteer (no native deps).
              // Create a new page at the target pixel size, embed the captured
              // image as a data URL, draw a consistent overlay in DOM/CSS,
              // then re-screenshot to produce a final, standardized OG image.
              let finalBuffer = buffer;
              try {
                const vw = 1200;
                const vh = 667;
                const deviceScaleFactor = 2;
                const targetW = Math.round(vw * deviceScaleFactor);
                const targetH = Math.round(vh * deviceScaleFactor);

                const imgData = `data:image/png;base64,${buffer.toString("base64")}`;

                const compPage = await browser.newPage();
                await compPage.setViewport({ width: targetW, height: targetH });

                const siteName = (
                  process.env.SITE_NAME ||
                  req.get("host") ||
                  ""
                )
                  .replace(/</g, "&lt;")
                  .replace(/"/g, "&quot;");
                const rawPath = String(renderPath || req.path || "");
                const sitePath = rawPath
                  .split("?")[0]
                  .replace(/</g, "&lt;")
                  .replace(/"/g, "&quot;");
                const baseUrl = `${req.protocol}://${req.get("host")}`;
                const fav1 = `${baseUrl.replace(/\/$/, "")}/android-chrome-512x512.png`;
                const fav2 = `${baseUrl.replace(/\/$/, "")}/android-chrome-196x196.png`;
                const fav3 = `${baseUrl.replace(/\/$/, "")}/apple-touch-icon.png`;
                const initials = (siteName || "GH").slice(0, 2).toUpperCase();

                // Prefer reading favicon files from the local filesystem (common
                // static asset locations) to avoid network requests and ensure
                // consistency in dev/test. Fall back to an SVG initials badge.
                const fs = require("fs");
                const path = require("path");
                const tryPaths = (filename) => {
                  const cwd = process.cwd();
                  return [
                    path.join(cwd, "assets", filename),
                    path.join(cwd, "static", "assets", filename),
                  ];
                };

                const fileDataUriFromUrl = (u) => {
                  try {
                    const parsed = new URL(u);
                    const filename = path.basename(parsed.pathname);
                    const cwd = process.cwd();
                    const candidates = [];
                    const contentRoot =
                      process.env.CONTENT_ROOT || process.env.CONTENT_HOST_PATH;
                    if (contentRoot) {
                      candidates.push(
                        path.join(
                          process.env.CONTENT_HOST_PATH,
                          "assets",
                          filename,
                        ),
                      );
                      // Some setups mount content under CONTENT_HOST_PATH and
                      // keep site assets alongside the content in a sibling
                      // ../assets directory — try that as well.
                      try {
                        const parentAssets = path.resolve(
                          contentRoot,
                          "..",
                          "assets",
                        );
                        candidates.push(path.join(parentAssets, filename));
                      } catch (e) {
                        // ignore
                      }
                    }
                    candidates.push(
                      path.join(cwd, "static", "assets", filename),
                    );
                    candidates.push(
                      path.join(
                        cwd,
                        "dist",
                        "public",
                        "static",
                        "assets",
                        filename,
                      ),
                    );
                    candidates.push(
                      path.join(cwd, "dist", "public", "assets", filename),
                    );
                    candidates.push(
                      path.join(
                        cwd,
                        "src",
                        "genomehubs-ui",
                        "static",
                        "assets",
                        filename,
                      ),
                    );
                    candidates.push(
                      path.join(
                        cwd,
                        "src",
                        "genomehubs-ui",
                        "public",
                        "static",
                        "assets",
                        filename,
                      ),
                    );
                    for (const p of candidates) {
                      try {
                        if (fs.existsSync(p)) {
                          const buf = fs.readFileSync(p);
                          const ext = path.extname(p).toLowerCase();
                          let ct = "image/png";
                          if (ext === ".svg") ct = "image/svg+xml";
                          else if (ext === ".ico") ct = "image/x-icon";
                          else if (ext === ".jpg" || ext === ".jpeg")
                            ct = "image/jpeg";
                          else if (ext === ".webp") ct = "image/webp";
                          return `data:${ct};base64,${buf.toString("base64")}`;
                        }
                      } catch (e) {
                        // continue
                      }
                    }
                  } catch (e) {
                    // ignore
                  }
                  return null;
                };

                let favDataUri =
                  fileDataUriFromUrl(fav1) ||
                  fileDataUriFromUrl(fav2) ||
                  fileDataUriFromUrl(fav3);
                if (!favDataUri) {
                  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'><rect width='100%' height='100%' fill='%23ffffff'/><text x='50%' y='55%' font-family='-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,\'Helvetica Neue\',Arial' font-size='40' text-anchor='middle' fill='%23333' font-weight='700'>${initials}</text></svg>`;
                  favDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                }

                const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    html,body{margin:0;padding:0;width:100%;height:100%;background:#fff}
    .container{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}
    img#report-img{max-width:100%;max-height:100%;object-fit:contain;display:block}
    .badge{position:absolute;top:32px;left:32px;display:flex;gap:12px;align-items:center;background:rgba(0,0,0,0.45);color:#fff;padding:16px 20px;border-radius:14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial;pointer-events:none}
    .fav{width:96px;height:96px;min-width:96px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .fav img{width:100%;height:100%;object-fit:cover;display:block}
    .texts{display:flex;flex-direction:column;line-height:1}
    .title{font-weight:700;font-size:40px}
    .path{font-size:22px;opacity:0.95;margin-top:6px}
  </style>
</head>
<body>
  <div class="container">
    <img id="report-img" src="${imgData}" alt="report" />
      <div class="badge" aria-hidden="true">
      <div class="fav"><img src="${favDataUri}" alt="favicon"/></div>
      <div class="texts">
        <div class="title">${siteName}</div>
        <div class="path">${sitePath}</div>
      </div>
    </div>
  </div>
  <script> (function(){ var i=document.getElementById('report-img'); if(!i.complete){ i.onload=function(){window.__imgLoaded=1}; i.onerror=function(){window.__imgLoaded=1}; } else { window.__imgLoaded=1; } })(); </script>
</body>
</html>`;

                await compPage.setContent(html, { waitUntil: "load" });
                try {
                  await compPage.waitForFunction(
                    () => window.__imgLoaded === 1,
                    {
                      timeout: 3000,
                    },
                  );
                } catch (e) {
                  // continue even if image load wait times out
                }

                const composedBuf = await compPage.screenshot({
                  type: "png",
                  fullPage: false,
                });
                try {
                  await compPage.close();
                } catch (e) {}
                finalBuffer = composedBuf;
              } catch (e) {
                console.log(
                  "[og-image] Puppeteer compositing fallback failed, sending raw buffer:",
                  e && e.message,
                );
              }

              res.set("Content-Type", "image/png");
              res.set("Cache-Control", "public, max-age=86400");
              res.status(200).send(finalBuffer);
              try {
                await browser.close();
              } catch (e) {}
              return;
            } catch (err) {
              console.error("Puppeteer render failed:", err);
              try {
                if (browser) await browser.close();
              } catch (e) {}
              // fall through to SVG fallback
            }
          }
        }
        // Fallback: server-side parse of markdown to find first report or image
        if (report) {
          const svg = renderReportToSVG(report);
          res.set("Content-Type", "image/svg+xml");
          res.set("Cache-Control", "public, max-age=86400");
          res.status(200).send(svg);
          return;
        }

        // Fallback: if markdown contains an image, use first image as redirect
        const imgMatch = md.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imgMatch) {
          const imgPath = imgMatch[2];
          // If image path is absolute /static/..., map to assets images
          if (imgPath.startsWith("/static/")) {
            const base = BASE_PATH.replace(/\/$/, "");
            const url = `${base}/assets/images/${imgPath.replace(/^\/static\//, "")}`;
            return res.redirect(url);
          }
          return res.redirect(imgPath);
        }

        // Final fallback: return a plain SVG placeholder
        const placeholder = renderReportToSVG({ title: "", caption: "" });
        res.set("Content-Type", "image/svg+xml");
        res.set("Cache-Control", "public, max-age=86400");
        res.status(200).send(placeholder);
      } catch (err) {
        console.error("OG image generation error:", err);
        res.status(500).send("Error generating image");
      }
    },
  );
} // <-- Add this closing brace to end the if (process.env.OG_RENDERER_URL) block

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Clean up description text by expanding directive inner content and
// removing image markdown, directive markers, and extra whitespace.
function sanitizeDescription(text) {
  if (!text) return "";
  let s = String(text);
  // Replace markdown images ![alt](url) with alt text
  s = s.replace(/!\[([^\]]*)\]\([^\)]+\)/g, (m, alt) => alt || "");
  // Replace directive patterns ::name[inner]{...} with inner
  s = s.replace(
    /::\w+\[([\s\S]*?)\](?:\{[^}]*\})?/g,
    (m, inner) => inner || "",
  );
  // Remove any remaining directive-like tokens ::name or {size=...}
  s = s.replace(/::\w+/g, "");
  s = s.replace(/\{[^}]*\}/g, "");
  // Collapse whitespace and trim
  s = s.replace(/\s+/g, " ").trim();
  // Limit length to reasonable meta description size
  if (s.length > 300) s = s.slice(0, 297) + "...";
  return s;
}

// Serve static built assets (don't send 404, let unmatched paths fall through)
app.use(
  BASE_PATH,
  express.static(BUILD_DIR, {
    maxAge: "1y",
    index: false,
    setHeaders: (res, filePath) => {
      // Set appropriate content types
      if (filePath.endsWith(".woff2")) {
        res.set("Content-Type", "font/woff2");
      } else if (filePath.endsWith(".svg")) {
        res.set("Content-Type", "image/svg+xml");
      } else if (filePath.endsWith(".json")) {
        res.set("Content-Type", "application/json");
      } else if (filePath.endsWith(".geojson")) {
        res.set("Content-Type", "application/geo+json");
      }
      // Content-addressed assets (with hash in filename) - cache forever
      if (filePath.match(/\.[a-f0-9]{10,}\..*$|\/static\//)) {
        res.set("Cache-Control", "public, max-age=31536000, immutable");
      }
      // Markdown content - moderate cache (1 day) to catch updates
      else if (filePath.endsWith(".md")) {
        res.set("Cache-Control", "public, max-age=86400, must-revalidate");
      }
      // API responses - short cache (5 minutes)
      else if (filePath.startsWith("api/")) {
        res.set("Cache-Control", "public, max-age=300");
      }
      // HTML files - don't cache to always get latest
      else if (filePath.endsWith(".html")) {
        res.set("Cache-Control", "public, max-age=0, must-revalidate");
      }
      // Default for other static assets
      else {
        res.set("Cache-Control", "public, max-age=3600");
      }

      // Add ETAG for revalidation
      res.set("Vary", "Accept-Encoding");
    },
  }),
);

// Health check endpoint
// OG renderer disabled handlers are registered unconditionally below

// Renderer status endpoint: reports availability of wkhtmltoimage and Puppeteer
app.get(
  `${BASE_PATH.replace(/\/$/, "")}/assets/og-renderer-status`,
  async (req, res) => {
    try {
      const rendererEnv = (process.env.OG_RENDERER || "auto").toLowerCase();
      const wkWhich = spawnSync("which", ["wkhtmltoimage"]);
      const canWkhtml = wkWhich.status === 0;
      let canPuppeteer = false;
      try {
        require.resolve("puppeteer");
        canPuppeteer = true;
      } catch (e) {
        try {
          require.resolve("puppeteer-core");
          canPuppeteer = true;
        } catch (e2) {
          canPuppeteer = false;
        }
      }
      const REMOTE_RENDERER_URL = process.env.OG_RENDERER_URL || null;
      let canRemote = false;
      if (REMOTE_RENDERER_URL) {
        try {
          const { request } = require("http");
          const { request: requestHttps } = require("https");
          const parsed = new URL(REMOTE_RENDERER_URL);
          const lib = parsed.protocol === "https:" ? requestHttps : request;
          const ok = await awaitHead(REMOTE_RENDERER_URL, lib);
          canRemote = !!ok;
        } catch (e) {
          canRemote = false;
        }
      }

      let recommended = "svg";
      if (rendererEnv === "wkhtmltoimage")
        recommended = canWkhtml ? "wkhtmltoimage" : "svg";
      else if (rendererEnv === "puppeteer")
        recommended = canPuppeteer ? "puppeteer" : "svg";
      else if (canWkhtml) recommended = "wkhtmltoimage";
      else if (canPuppeteer) recommended = "puppeteer";
      else recommended = "svg";

      res.status(200).json({
        configured: rendererEnv,
        canWkhtml: !!canWkhtml,
        canPuppeteer: !!canPuppeteer,
        canRemote: !!canRemote,
        recommended: recommended,
      });
    } catch (err) {
      res.status(500).json({ error: err && err.message });
    }
  },
);

// helper for lightweight HEAD/GET availability check used in status endpoint
function awaitHead(u, lib) {
  return new Promise((resolve) => {
    try {
      const req = lib(u, { method: "HEAD", timeout: 2000 }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 500);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        try {
          req.destroy();
        } catch (e) {}
        resolve(false);
      });
      req.end();
    } catch (e) {
      resolve(false);
    }
  });
}

// Runtime config endpoint (available to client-side code)
app.get(`${BASE_PATH.replace(/\/$/, "")}/assets/config`, (req, res) => {
  res.status(200).json(runtimeConfig);
});

// Markdown fetch endpoint for SPA client-side navigation
// Allows dynamic markdown from mounted content directory to be served to the browser
app.get(
  `${BASE_PATH.replace(/\/$/, "")}/assets/markdown/*`,
  async (req, res) => {
    try {
      const filePath = req.params[0]; // e.g., "projects/DTOL"
      const mdPath = resolveMarkdownPath(`/${filePath}`);

      if (mdPath) {
        let content = fs.readFileSync(mdPath, "utf8");

        // Get file modification time for ETag
        const stats = fs.statSync(mdPath);
        const mtime = Math.floor(stats.mtimeMs / 1000);
        const etag = `"${stats.size}-${mtime}"`;

        // Set cache headers with ETag for revalidation
        res.set("ETag", etag);
        res.set("Cache-Control", "public, max-age=86400, must-revalidate");
        res.set("Vary", "Accept-Encoding");

        // Rewrite image paths to use the API endpoint
        // Images like /static/images/... → /assets/images/...
        // This ensures images are served from the mounted content directory
        const base = BASE_PATH.replace(/\/$/, "");
        content = content.replace(
          /!\[([^\]]*)\]\(\/static\/([^)]+)\)/g,
          (match, alt, path) => {
            return `![${alt}](${base}/assets/images/${path})`;
          },
        );

        res.status(200).type("text/plain").send(content);
      } else {
        res.status(404).json({
          error: "Markdown file not found",
          path: filePath,
          CONTENT_ROOT,
        });
      }
    } catch (err) {
      console.error("Markdown fetch error:", err);
      res.status(500).json({ error: "Failed to fetch markdown" });
    }
  },
);

// Image fetch endpoint for markdown content images
// Serves images from the mounted content directory
app.get(`${BASE_PATH.replace(/\/$/, "")}/assets/images/*`, async (req, res) => {
  try {
    let filePath = req.params[0]; // e.g., "images/DToL_Logo_with_text.png"
    if (!filePath.startsWith("images/")) {
      filePath = `images/${filePath}`;
    }

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
      const stats = fs.statSync(imagePath);
      const mtime = Math.floor(stats.mtimeMs / 1000);
      const etag = `"${stats.size}-${mtime}"`;

      // Images don't change often - cache for 30 days
      res.set("ETag", etag);
      res.set("Cache-Control", "public, max-age=2592000, must-revalidate");
      res.set("Vary", "Accept-Encoding");

      res.status(200).sendFile(imagePath);
    } else {
      res.status(404).json({ error: "Image not found", path: filePath });
    }
  } catch (err) {
    console.error("Image fetch error:", err);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

// Rewrite root-level asset files to /assets with BASE_PATH awareness
app.use((req, res, next) => {
  const base = BASE_PATH.replace(/\/$/, "");
  const localPath = req.path.replace(new RegExp(`^${base}`), "") || "/";
  if (
    /^\/[^/]+\.(png|jpg|jpeg|gif|svg|ico|json|webmanifest|xml|txt)$/.test(
      localPath,
    )
  ) {
    req.url = `${base}/assets${localPath}`;
  }
  next();
});

app.get(`${BASE_PATH.replace(/\/$/, "")}/assets/*`, (req, res) => {
  const assetPath = path.join(CONTENT_ROOT, "../assets", req.params[0]); // Remove leading /

  // Security: prevent directory traversal
  if (assetPath.includes("..")) {
    return res.status(400).json({ error: "Invalid path" });
  }

  // Verify the file is within the assets directory
  if (!assetPath.startsWith(path.join(CONTENT_ROOT, "../assets"))) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
    res.sendFile(assetPath);
  } else {
    res.status(404).send("Not Found");
  }
});

// Stub route for cookies script (only available in full production)
app.get(`${BASE_PATH.replace(/\/$/, "")}/js/cookies-gcc.js`, (req, res) => {
  const cookiesPath = path.join(BUILD_DIR, "js", "cookies-gcc.js");

  if (fs.existsSync(cookiesPath) && fs.statSync(cookiesPath).isFile()) {
    res.set("Content-Type", "application/javascript");
    res.sendFile(cookiesPath);
  } else {
    // Return empty stub to prevent 404 in dev/test environments
    res.set("Content-Type", "application/javascript");
    res.send("// Cookies script stub - only available in production\n");
  }
});

// For favicons specifically
app.get(`${BASE_PATH.replace(/\/$/, "")}/favicon.ico`, (req, res) => {
  const faviconPath = path.join(CONTENT_ROOT, "../assets/favicon.ico");
  if (fs.existsSync(faviconPath)) {
    res.sendFile(faviconPath);
  } else {
    res.status(404).send("Not Found");
  }
});

// Debug middleware: log requests for JS/CSS/JSON assets and whether the
// corresponding file exists in the built `dist/public` directory. This helps
// diagnose cases where asset requests fall through to the SPA fallback and
// return `index.html` (causing `Unexpected token '<'`).
app.use((req, res, next) => {
  try {
    const m = req.path.match(/\.(js|css|json)$/i);
    if (m) {
      const base = BASE_PATH.replace(/\/$/, "");
      // Map request path to build dir file candidate
      const rel = req.path.replace(new RegExp(`^${base}`), "") || req.path;
      const candidate = path.join(BUILD_DIR, rel.replace(/^\//, ""));
      let exists = false;
      try {
        exists = fs.existsSync(candidate) && fs.statSync(candidate).isFile();
      } catch (e) {
        exists = false;
      }
      console.log(
        `[asset-check] ${req.method} ${req.path} -> ${candidate} exists=${exists}`,
      );
    }
  } catch (e) {}
  next();
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

      // Build absolute URL for OG image endpoint for this path only when
      // an OG renderer is configured. If no renderer is present we do NOT
      // inject an `og:image` meta tag so pages can fall back to the
      // default image defined statically in the page head.
      let ogImageUrl = null;
      if (process.env.OG_RENDERER_URL) {
        const base = BASE_PATH.replace(/\/$/, "");
        const ogImagePath = `${base}/assets/og-image${req.path}`;
        ogImageUrl = `${req.protocol}://${req.get("host")}${ogImagePath}`;
      }

      const page = injectIntoIndexHtml(
        ssrHtml,
        req.originalUrl,
        firstHeading,
        description,
        ogImageUrl,
      );
      res.status(200).send(page);
      return;
    }

    // Fallback: serve SPA index.html with runtime config injected EARLY
    let page = indexHtml;

    // Rewrite script/link URLs to include basename
    const basePrefix = BASE_PATH.replace(/\/$/, ""); // e.g., "/archive"
    console.log(
      `[SPA fallback] BASE_PATH="${BASE_PATH}", basePrefix="${basePrefix}"`,
    );
    page = rewriteAssetUrlsForBasename(page, basePrefix);

    // CRITICAL: Set webpack's public path IMMEDIATELY as very first script
    // Inline directly in HTML with NO delays to ensure chunk loading uses correct path
    // Must run before any other JS executes
    const publicPathScript = `<script>
var raw = "${runtimeConfig.GH_BASENAME}" || "";
var clean = String(raw).replace(/^\\/+|\\/+$/g, "");
var basePrefix = clean ? "/" + clean : "";
window.__webpack_public_path__ = basePrefix + "/";
// Also set for webpack 5's internal variable if different
if (typeof __webpack_public_path__ !== 'undefined') {
  __webpack_public_path__ = basePrefix + "/";
}
</script>`;

    const configScript = `${publicPathScript}
<script>
window.process = window.process || {};
window.process.ENV = ${JSON.stringify(runtimeConfig)};
// Map to webpack DefinePlugin-style globals for compatibility
window.SITENAME = window.process.ENV.GH_SITENAME;
window.SITENAME_LONG = window.process.ENV.GH_SITENAME_LONG;
window.BASENAME = window.process.ENV.GH_BASENAME;
window.CITATION_URL = window.process.ENV.GH_CITATION_URL;
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
  __orig_console.log(
    `GenomeHubs UI SSR server listening on port ${PORT}, base path ${BASE_PATH}`,
  );
  __orig_console.log(`Serving built assets from ${BUILD_DIR}`);
  __orig_console.log(`Markdown content root: ${CONTENT_ROOT}`);
  __orig_console.log(`SSR Mode: ${SSR_MODE}`);
  __orig_console.log(`Runtime config:`, runtimeConfig);
});
