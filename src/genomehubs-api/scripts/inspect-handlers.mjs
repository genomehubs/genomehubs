import { createRequire } from "module";
import path from "path";
const require = createRequire(import.meta.url);
const mapPath = path.join(
  process.cwd(),
  "src",
  "generated",
  "operation-handlers.cjs"
);
let m;
try {
  m = require(mapPath);
} catch (e) {
  console.error("require failed", e && e.message);
  process.exit(2);
}
for (const k of Object.keys(m)) {
  const v = m[k];
  console.log(k, "->", typeof v, v && v.constructor && v.constructor.name);
  if (typeof v === "object") {
    try {
      console.log("  keys:", Object.keys(v));
    } catch (e) {
      console.log("  keys: <err>");
    }
  }
}
