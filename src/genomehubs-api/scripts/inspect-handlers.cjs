const path = require("path");
const mapPath = path.join(
  __dirname,
  "..",
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
  console.log(
    k,
    "->",
    typeof v,
    Array.isArray(v)
      ? "array"
      : (v && v.constructor && v.constructor.name) || null
  );
  if (typeof v === "object") {
    try {
      console.log("  keys:", Object.keys(v));
    } catch (e) {
      console.log("  keys: <err>");
    }
    try {
      console.log("  toString:", v && v.toString && v.toString().slice(0, 120));
    } catch (e) {}
  }
}
