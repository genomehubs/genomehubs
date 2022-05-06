const express = require("express");
const fs = require("fs");
const path = require("path");
// const nocache = require("nocache");

const PORT = process.env.GH_PORT || process.env.GH_CLIENT_PORT || "8880";
const GH_API_PORT = process.env.GH_API_PORT || "3000";
const GH_API_HOST = process.env.GH_API_HOST || "localhost";
const GH_SUGGESTED_TERM = process.env.GH_SUGGESTED_TERM || "Nematoda";
const GH_API_VERSION = process.env.GH_API_VERSION || "v2";
const GH_API_URL =
  process.env.GH_API_URL ||
  `http://${GH_API_HOST}:${GH_API_PORT}/api/${GH_API_VERSION}`;
const app = express();

const ENV = {
  GH_API_URL,
  GH_SUGGESTED_TERM,
};

// disable browser caching
// app.use(nocache());
// app.set("etag", false);

// set the view engine to ejs
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// serve static assets normally
// get hash value from directory name
const getDirectories = (srcPath) => {
  return fs
    .readdirSync(srcPath)
    .filter((file) => fs.statSync(path.join(srcPath, file)).isDirectory());
};

let directories = getDirectories(path.resolve(__dirname, "public", "static"));

app.use(
  `static/${directories[0]}`,
  express.static("/genomehubs/local/static", { eTag: false, maxAge: 0 })
);
app.use(express.static("/genomehubs/local"));
app.use(express.static(path.resolve(__dirname, "public")));
app.use(
  "/manifest.json",
  express.static(path.resolve(__dirname, "public/manifest.json"))
);

// handle every other route with index.html, which will contain
// a script tag to your application's JavaScript file(s).
app.get("*", function (req, res) {
  // response.sendFile(path.resolve(__dirname, "view/index.html"));
  res.render("index", {
    variables: `window.process = ${JSON.stringify({ ENV })}`,
  });
});

app.listen(PORT);
console.log("genomehubs-ui started http on port " + PORT);
