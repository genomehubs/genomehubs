#!/usr/bin/env node

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

(async () => {
  const outdir = path.resolve(__dirname, "..", "build");
  const srcApi = path.resolve(__dirname, "..", "src", "api");
  const buildApi = path.resolve(outdir, "api");
  if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });
  // Always copy the API sources into the build output so bundled code can require
  // runtime helpers and route modules that are resolved relative to build/.
  try {
    // remove any existing build/api and replace with fresh copy
    if (fs.existsSync(buildApi)) {
      fs.rmSync(buildApi, { recursive: true, force: true });
    }
    // copy tree
    const copyDir = (src, dest) => {
      if (!fs.existsSync(src)) return;
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      for (const name of fs.readdirSync(src)) {
        const s = path.join(src, name);
        const d = path.join(dest, name);
        const st = fs.statSync(s);
        if (st.isDirectory()) copyDir(s, d);
        else fs.copyFileSync(s, d);
      }
    };
    copyDir(srcApi, buildApi);
    // copy top-level api spec if present
    const apiSpecSrc = path.resolve(__dirname, "..", "src", "api-v2.yaml");
    const apiSpecDest = path.join(outdir, "api-v2.yaml");
    if (fs.existsSync(apiSpecSrc)) fs.copyFileSync(apiSpecSrc, apiSpecDest);
  } catch (e) {
    console.warn('Warning: failed to copy API sources to build/:', e && e.message);
  }
  try {
    await esbuild.build({
      entryPoints: [path.resolve(__dirname, "..", "src", "app.js")],
      bundle: true,
      minify: true,
      platform: "node",
      target: ["node24"],
      format: "cjs",
      outfile: path.join(outdir, "bundle.cjs"),
      sourcemap: false,
      external: [],
      logLevel: "info",
      loader: {
        ".mjs": "js",
        ".js": "js",
      },
      define: {
        "process.env.NODE_ENV": JSON.stringify(
          process.env.NODE_ENV || "production"
        ),
      },
      plugins: [
        {
          name: "d3-family-alias",
          setup(build) {
            const pkgMap = {
              "d3-format": ["d3-format", "dist", "d3-format.js"],
              "d3-scale": ["d3-scale", "dist", "d3-scale.js"],
              "d3-interpolate": ["d3-interpolate", "dist", "d3-interpolate.js"],
              "d3-color": ["d3-color", "dist", "d3-color.js"],
            };

            // Map bare imports like 'd3-format' to their dist UMD files when available.
            build.onResolve(
              {
                filter: /^(d3-format|d3-scale|d3-interpolate|d3-color)(\/.*)?$/,
              },
              (args) => {
                const pkg = args.path.split("/")[0];
                const map = pkgMap[pkg];
                if (map) {
                  const distPath = path.resolve(
                    __dirname,
                    "..",
                    "node_modules",
                    map[0],
                    map[1],
                    map[2]
                  );
                  if (fs.existsSync(distPath)) return { path: distPath };
                }
                return null; // fall back to default resolution
              }
            );
          },
        },
      ],
    });
    console.log("Bundle written to", path.join(outdir, "bundle.cjs"));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
