#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const webpack = require("webpack");

const out = path.resolve(__dirname, "..", "build", "webpack-bundle.cjs");
const config = {
  mode: "production",
  target: "node",
  entry: path.resolve(__dirname, "..", "src", "app.js"),
  output: {
    path: path.dirname(out),
    filename: path.basename(out),
    libraryTarget: "commonjs2",
  },
  resolve: {
    extensions: [".js", ".mjs", ".cjs", ".json"],
    alias: {
      "d3-format": path.resolve(
        __dirname,
        "..",
        "node_modules",
        "d3-format",
        "src",
        "index.js"
      ),
    },
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        // Transpile our app and selected ESM node_modules that must be bundled
        include: [
          path.resolve(__dirname, "..", "src"),
          path.resolve(__dirname, "..", "node_modules", "d3-format"),
          path.resolve(__dirname, "..", "node_modules", "d3-scale"),
          path.resolve(__dirname, "..", "node_modules", "d3-interpolate"),
          path.resolve(__dirname, "..", "node_modules", "d3-color"),
          path.resolve(__dirname, "..", "node_modules", "@json2csv"),
          path.resolve(__dirname, "..", "node_modules", "@streamparser"),
          path.resolve(__dirname, "..", "node_modules", "uuid"),
        ],
        use: {
          loader: require.resolve("babel-loader"),
          options: {
            plugins: ["@babel/plugin-transform-modules-commonjs"],
          },
        },
      },
    ],
  },
  externals: [],
  optimization: { minimize: false },
};

const compiler = webpack(config);
compiler.run((err, stats) => {
  if (err) {
    console.error(err.stack || err);
    if (err.details) console.error(err.details);
    process.exit(1);
  }
  const info = stats.toJson();
  if (stats.hasErrors()) console.error(info.errors);
  if (stats.hasWarnings()) console.warn(info.warnings);
  console.log("Webpack bundle written to", out);
  compiler.close(() => {});
});
