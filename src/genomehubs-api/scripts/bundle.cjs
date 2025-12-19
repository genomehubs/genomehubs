#!/usr/bin/env node

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

(async () => {
  const outdir = path.resolve(__dirname, "..", "build");
  if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });
  try {
    await esbuild.build({
      entryPoints: [path.resolve(__dirname, "..", "src", "app.js")],
      bundle: true,
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
