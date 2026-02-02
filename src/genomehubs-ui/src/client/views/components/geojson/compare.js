const fs = require("fs");
const full = JSON.parse(fs.readFileSync("countries-full.geojson", "utf8"));
const simple = JSON.parse(fs.readFileSync("countries-simple.geojson", "utf8"));

console.log("Full geojson:");
console.log("  Features:", full.features.length);
console.log("  First feature geometry type:", full.features[0].geometry.type);
console.log(
  "  First feature coords count:",
  full.features[0].geometry.type === "Polygon"
    ? full.features[0].geometry.coordinates[0].length
    : full.features[0].geometry.coordinates[0][0].length,
);
console.log("  File size:", fs.statSync("countries-full.geojson").size);

console.log("\nSimplified geojson:");
console.log("  Features:", simple.features.length);
console.log("  First feature geometry type:", simple.features[0].geometry.type);
console.log(
  "  First feature coords count:",
  simple.features[0].geometry.type === "Polygon"
    ? simple.features[0].geometry.coordinates[0].length
    : simple.features[0].geometry.coordinates[0][0].length,
);
console.log("  File size:", fs.statSync("countries-simple.geojson").size);

console.log("\nFirst feature comparison:");
console.log("Full:", full.features[0].properties.ADMIN);
console.log("Simple:", simple.features[0].properties.ADMIN);

// Check if order is different
console.log("\nFeature order comparison (first 5):");
for (let i = 0; i < 5; i++) {
  console.log(
    `  ${i}: Full="${full.features[i].properties.ADMIN}", Simple="${simple.features[i].properties.ADMIN}"`,
  );
}
