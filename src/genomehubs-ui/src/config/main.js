require("dotenv").config();

const appRoot = require("app-root-path");
const GH_SITENAME = process.env.GH_SITENAME || "Demo GenomeHub";
const GH_HOST = process.env.GH_HOST || "localhost";
const GH_CLIENT_PORT = Number(process.env.GH_CLIENT_PORT) || 8880;
const GH_API_PORT = Number(process.env.GH_API_PORT) || 3000;
const GH_API_VERSION = String(process.env.GH_API_VERSION) || "api/v0.0.1";
const GH_HTTPS = String(process.env.GH_HTTPS) === "true";
const GH_API_URL =
  process.env.GH_API_URL ||
  (GH_HTTPS ? "https" : "http") +
    "://" +
    GH_HOST +
    ":" +
    GH_API_PORT +
    "/" +
    GH_API_VERSION;
const GH_ORIGINS = process.env.GH_ORIGINS
  ? process.env.GH_ORIGINS.split(" ")
  : [
      "localhost",
      "null",
      GH_HOST,
      (GH_HTTPS ? "https" : "http") + "://" + GH_HOST + ":" + GH_CLIENT_PORT,
    ];
const FILE_PATH = process.env.GH_FILE_PATH || appRoot + "/demo";

module.exports = {
  // site name
  siteName: GH_SITENAME,
  // setting port for server
  client_port: GH_CLIENT_PORT,
  // setting port for server
  api_port: GH_API_PORT,
  // flag to use https
  https: GH_HTTPS,
  // Cors settings
  cors: {
    allowedOrigins: GH_ORIGINS,
  },
  // API URL
  apiUrl: GH_API_URL,
  // pages commit hash
  commitHash: process.env.GH_COMMIT_HASH || "",
  // pages URL
  pagesUrl: process.env.GH_PAGES_URL || "/static",
  // pages Path
  pagesPath: process.env.GH_PAGES_PATH || "./src/client/static",
  // url basename
  basename:
    `/${process.env.GH_BASENAME}`
      .replace(/^\/\//, "/")
      .replace(/\/$/, "")
      .replace("undefined", "") || "",
  // path to read flatfiles
  filePath: FILE_PATH,
  // version
  version: process.env.GH_VERSION || "v2.0",
  // archive versions
  archive: (process.env.GH_ARCHIVE || "").split(" "),
  // hostname
  hostname: GH_HOST,
  // default taxonomy
  taxonomy: process.env.GH_TAXONOMY,
  mode: process.env.NODE_ENV || "test",
  ga_id: process.env.GH_GA_ID || "",
  gdpr_url: process.env.GH_GDPR_URL || "",
  message: process.env.GH_MESSAGE || false,
  disableHostCheck: String(process.env.GH_DISABLE_HOST_CHECK) === "true",
  suggestedTerm: process.env.GH_SUGGESTED_TERM,
  treeThreshold: process.env.GH_TREE_THRESHOLD || 2000,
  mapThreshold: process.env.GH_MAP_THRESHOLD || 2000,
  // https://www.visualisingdata.com/2019/08/five-ways-to-design-for-red-green-colour-blindness/
  directColor: "#006164",
  ancestralColor: "#db4325",
  descendantColor: "#eda247",
  directHighlight: "#57c4ad",
  descendantHighlight: "#e6e1bc",
};
