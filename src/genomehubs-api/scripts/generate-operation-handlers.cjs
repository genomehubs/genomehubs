#!/usr/bin/env node

/**
 * Generate a static handlers index file that directly requires all route modules
 * and picks the appropriate function export. This ensures handlers are included
 * in esbuild bundles via static require() calls.
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.resolve(__dirname, '..', 'src', 'api', 'v2', 'routes');
const reportsDir = path.resolve(__dirname, '..', 'src', 'api', 'v2', 'reports');
const argOut = process.argv[2];
let outDir;
if (argOut) {
  outDir = path.isAbsolute(argOut) ? path.resolve(argOut) : path.resolve(__dirname, '..', argOut);
} else {
  outDir = path.resolve(__dirname, '..', 'build');
}
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => path.join(dir, f));
}

const srcFiles = [...scanDir(routesDir), ...scanDir(reportsDir)];

const files = srcFiles.map(srcPath => {
  const rel = path.relative(path.resolve(__dirname, '..', 'src'), srcPath).replace(/\\/g, '/');
  const buildCandidate = path.resolve(__dirname, '..', 'build', rel);
  const resolved = fs.existsSync(buildCandidate) ? buildCandidate : srcPath;
  return { rel, resolved };
});

// Generate imports and map entries
const imports = [];
const mapEntries = [];

files.forEach((fileObj, idx) => {
  const file = fileObj.resolved;
  const keyBase = fileObj.rel.replace(/\\/g, '/').replace(/\.js$/, '');
  
  // Compute relative path from outDir to the resolved file
  const relPath = './' + path.relative(outDir, file).replace(/\\/g, '/');
  const varName = `m${idx}`;
  
  // Import the module
  imports.push(`const ${varName} = require('${relPath}');`);
  
  // Pick the function export: try common names first, then first function in object
  const pickLogic = `
  (() => {
    if (typeof ${varName} === 'function') return ${varName};
    if (${varName} && typeof ${varName}.default === 'function') return ${varName}.default;
    if (${varName} && typeof ${varName}.handler === 'function') return ${varName}.handler;
    if (${varName} && typeof ${varName}.getSearchResultCount === 'function') return ${varName}.getSearchResultCount;
    if (${varName} && typeof ${varName}.getReport === 'function') return ${varName}.getReport;
    if (${varName} && typeof ${varName}.get === 'function') return ${varName}.get;
    if (${varName} && typeof ${varName} === 'object') {
      const k = Object.keys(${varName}).find(x => typeof ${varName}[x] === 'function');
      if (k) return ${varName}[k];
      if (${varName}.default && typeof ${varName}.default === 'object') {
        const k2 = Object.keys(${varName}.default).find(x => typeof ${varName}.default[x] === 'function');
        if (k2) return ${varName}.default[k2];
      }
    }
    return null;
  })()
  `.trim().replace(/\n\s*/g, ' ');
  
  // Map entries: both with and without .js suffix for compatibility
  mapEntries.push(`  '${keyBase}': ${pickLogic}`);
  mapEntries.push(`  '${keyBase}.js': ${pickLogic}`);
});

const out = `// Auto-generated static operation handlers index
// This file statically imports all route/report modules so esbuild includes them in bundles.

${imports.join('\n')}

module.exports = {
${mapEntries.join(',\n')}
};
`;

fs.writeFileSync(path.join(outDir, 'operation-handlers.cjs'), out);
console.log('Wrote', path.join(outDir, 'operation-handlers.cjs'));
