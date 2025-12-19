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
      // Some packages may use dynamic requires; keep those external to avoid bundling issues
      // We leave most node_modules to be bundled; if runtime errors occur we can mark packages as external
    });
    console.log("Bundle written to", path.join(outdir, "bundle.cjs"));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
