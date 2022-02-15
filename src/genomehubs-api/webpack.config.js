const path = require("path");

const config = {
  mode: "production",
  entry: "./src/app.js",
  target: "node",
  output: {
    path: path.resolve(__dirname, "build", "lib"),
    chunkFormat: "commonjs",
  },
  externals: { vertx: "commonjs vertx" },
};

module.exports = config;
