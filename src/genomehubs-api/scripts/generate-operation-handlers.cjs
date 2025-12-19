#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const routesDir = path.resolve(__dirname, "..", "src", "api", "v2", "routes");
const reportsDir = path.resolve(__dirname, "..", "src", "api", "v2", "reports");
const outDir = path.resolve(__dirname, "..", "build");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".js"))
    .map((f) => path.join(dir, f));
}

// Collect source files (keep source path and resolved file to require)
const srcFiles = [...scanDir(routesDir), ...scanDir(reportsDir)];

const files = srcFiles.map((srcPath) => {
  // prefer compiled build files when available
  const rel = path
    .relative(path.resolve(__dirname, "..", "src"), srcPath)
    .replace(/\\/g, "/");
  const buildCandidate = path.resolve(__dirname, "..", "build", rel);
  const resolved = fs.existsSync(buildCandidate) ? buildCandidate : srcPath;
  return { srcPath, rel, resolved };
});

const imports = [];
const mapEntries = [];

files.forEach((fileObj, idx) => {
  const file = fileObj.resolved;
  const relRequire = "./" + path.relative(outDir, file).replace(/\\/g, "/");
  const name = "m" + idx;
  imports.push(`const ${name} = require('${relRequire}');`);
  // map key should match OpenAPI x-eov-operation-handler baseName (relative to src, without .js)
  const keyBase = fileObj.rel.replace(/\\/g, "/").replace(/\.js$/, "");
  // export both forms: without .js and with .js to be resilient
  mapEntries.push(`  '${keyBase}': ${name}`);
  mapEntries.push(`  '${keyBase}.js': ${name}`);
});

const out = `// generated file - contains literal requires for operation handlers
${imports.join("\n")}

module.exports = {
${mapEntries.join(",\n")}
};
`;

fs.writeFileSync(path.join(outDir, "operation-handlers.cjs"), out);
console.log("Wrote", path.join(outDir, "operation-handlers.cjs"));
