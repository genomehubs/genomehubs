const express = require("express");
const fs = require("fs");
const path = require("path");
const helmet = require("helmet");

const PORT = process.env.GH_PORT || process.env.GH_CLIENT_PORT || "8880";
const GH_API_PORT = process.env.GH_API_PORT || "3000";
const GH_API_HOST = process.env.GH_API_HOST || "localhost";
const GH_SUGGESTED_TERM = process.env.GH_SUGGESTED_TERM || "Nematoda";
const GH_API_VERSION = process.env.GH_API_VERSION || "v2";
const GH_ARCHIVE = (process.env.GH_ARCHIVE || "").split(" ");
const GH_SITENAME = process.env.GH_SITENAME || "";
const GH_BASENAME =
  `/${process.env.GH_BASENAME}`.replace(/^\/\//, "/").replace(/\/$/, "") || "";
const GH_API_URL =
  process.env.GH_API_URL ||
  `http://${GH_API_HOST}:${GH_API_PORT}/api/${GH_API_VERSION}`;
const app = express();

const ENV = {
  GH_API_URL,
  GH_ARCHIVE,
  GH_BASENAME,
  GH_SITENAME,
  GH_SUGGESTED_TERM,
};

// set site basename
app.set("base", GH_BASENAME);

// set the view engine to ejs
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(
  helmet(
    helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        imgSrc: [
          "'self'",
          "https: data:",
          "https://*.genomehubs.org",
          "api.phylopic.org",
        ],
        connectSrc: ["'self'", "api.phylopic.org"],
      },
    })
  )
);

// serve static assets normally
// get hash value from directory name
const getDirectories = (srcPath) => {
  return fs
    .readdirSync(srcPath)
    .filter((file) => fs.statSync(path.join(srcPath, file)).isDirectory());
};

let directories = getDirectories(path.resolve(__dirname, "public"));

app.use(
  `${
    GH_BASENAME > "/"
      ? `${GH_BASENAME}/static/${directories[0]}`
      : `static/${directories[0]}`
  }`,
  express.static("/genomehubs/local/static", { eTag: false, maxAge: 0 })
);

app.use(GH_BASENAME, express.static(path.resolve(__dirname, "public")));

app.use(
  `${
    GH_BASENAME > "/" ? `${GH_BASENAME}/${directories[0]}` : `${directories[0]}`
  }`,
  express.static("/genomehubs/local/render", {
    eTag: false,
    maxAge: 0,
  })
);

app.use(GH_BASENAME, express.static(path.resolve(__dirname, "render")));

app.use(GH_BASENAME, express.static(path.resolve(__dirname, "public")));

app.get("*.md", (req, res) => {
  res.status(200).send(`${req.path} not found`);
});

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
