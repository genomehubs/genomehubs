const express = require("express");
const path = require("path");
const PORT = process.env.GH_PORT || process.env.GH_CLIENT_PORT || "8880";
const GH_API_PORT = process.env.GH_API_PORT || "3000";
const GH_API_VERSION = process.env.GH_API_VERSION || "v2";
const GH_API_URL =
  process.env.GH_API_URL ||
  `http://localhost:${GH_API_PORT}/api/${GH_API_VERSION}`;
const app = express();

const ENV = {
  GH_API_URL,
};

// set the view engine to ejs
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

// serve static assets normally
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
