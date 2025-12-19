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
  // Special-case: for the report route, emit a wrapper that delegates to the correct
  // report sub-handler at runtime (getTree/getMap/getReport/etc.). This avoids the
  // static resolver picking the wrong exported function.
  const keyBase = fileObj.rel.replace(/\\/g, "/").replace(/\.js$/, "");
  if (keyBase === "api/v2/routes/report") {
    const wrapperDir = path.join(outDir, "wrappers", path.dirname(fileObj.rel));
    if (!fs.existsSync(wrapperDir))
      fs.mkdirSync(wrapperDir, { recursive: true });
    const wrapperPath = path.join(wrapperDir, path.basename(fileObj.rel));
    const wrapperRelRequire =
      "./" + path.relative(outDir, file).replace(/\\/g, "/");
    const wrapperContent = `// generated wrapper for report route\nconst mod = require('${wrapperRelRequire}');\nif (mod && typeof mod.getReport === 'function') {\n  module.exports = mod.getReport;\n} else {\n  module.exports = function (req, res, next) {\n    try {\n      const rpt = (req && (req.expandedQuery && req.expandedQuery.report ? req.expandedQuery.report : (req.query && req.query.report))) || (req && req.body && req.body.report);\n      if (rpt && typeof rpt === 'string') {\n        const nameCandidates = [\n          'get' + rpt[0].toUpperCase() + rpt.slice(1),\n          rpt,\n          rpt + 'Report',\n          'histPerRank',\n          'histogram'\n        ];\n        for (const n of nameCandidates) {\n          if (mod && typeof mod[n] === 'function') return mod[n](req, res, next);\n        }\n      }\n      if (mod && typeof mod.getTree === 'function' && (req && req.query && (req.query.report === 'tree'))) return mod.getTree(req, res, next);\n      if (mod && typeof mod.getReport === 'function') return mod.getReport(req, res, next);\n      if (mod && typeof mod === 'object') {\n        const fnKey = Object.keys(mod).find(k => typeof mod[k] === 'function');\n        if (fnKey) return mod[fnKey](req, res, next);\n      }\n      throw new Error('No report handler available');\n    } catch (e) {\n      return next(e);\n    }\n  };\n}\n`;
    fs.writeFileSync(wrapperPath, wrapperContent);
    const relWrapperRequire =
      "./" + path.relative(outDir, wrapperPath).replace(/\\/g, "/");
    imports.push(`const ${name} = require('${relWrapperRequire}');`);
    mapEntries.push(`  '${keyBase}': ${name}`);
    mapEntries.push(`  '${keyBase}.js': ${name}`);
    return;
  }
  imports.push(`const ${name} = require('${relRequire}');`);
  // map key should match OpenAPI x-eov-operation-handler baseName (relative to src, without .js)
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
