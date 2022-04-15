import * as OpenApiValidator from "express-openapi-validator";

import YAML from "yamljs";
// import { cache } from "./api/v2/functions/cache";
import compression from "compression";
import { config } from "./api/v2/functions/config.js";
import cookieParser from "cookie-parser";
import express from "express";
import { logError } from "./api/v2/functions/logger.js";
import path from "path";
import swaggerUi from "swagger-ui-express";
import zip from "express-easy-zip";

const port = config.port;
const apiSpec = path.join(__dirname, "api-v2.yaml");

let swaggerDocument = YAML.load(apiSpec);
swaggerDocument.info.description = config.description;
swaggerDocument.info.title = config.title;
swaggerDocument.info.version = config.url.replace(/.+\//, "");
swaggerDocument.info.contact.name = config.contactName;
swaggerDocument.info.contact.email = config.contactEmail;
swaggerDocument.components.parameters.taxonomyParam.schema.default =
  config.taxonomy;
swaggerDocument.components.parameters.taxonomyParam.description += ` [default: ${config.taxonomy}]`;
swaggerDocument.servers[0].url = config.url;
// Temporarily redirect old API requests to v2
swaggerDocument.servers[1] = { ...swaggerDocument.servers[0] };
swaggerDocument.servers[1].url = config.url.replace("v2", "v0.0.1");

const swaggerOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: `${config.title} API`,
};

const app = express();
app.use(zip());
app.use(compression());
if (config.cors) {
  const cors = require("cors");
  app.use(cors(config.cors));
}

app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(express.json());
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "public")));
app.get("/api-spec", function (req, res) {
  res.header("Content-Type", "text/yaml");
  res.send(YAML.stringify(swaggerDocument, 8, 4));
});
if (process.pkg) {
  app.use(express.static(path.join(__dirname, "api-docs")));
}
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, swaggerOptions)
);

app.use(
  OpenApiValidator.middleware({
    apiSpec: swaggerDocument,
    validateRequests: {
      allowUnknownQueryParameters: true,
      removeAdditional: "all",
    },
    validateResponses: true,
    operationHandlers: path.join(__dirname),
  })
);

app.use((err, req, res, next) => {
  let error = {
    message: err.message,
    errors: err.errors,
  };
  res.status(err.status || 500).json(error);
  logError({ ...error, req });
});

if (config.https) {
  const https = require("https");
  const fs = require("fs");
  const options = {
    key: fs.readFileSync(config.keyFile),
    cert: fs.readFileSync(config.certFile),
  };
  https.createServer(options, app).listen(port, () => {
    console.log(`genomehubs-api started on https port ${port}`);
  });
} else {
  const http = require("http");
  http.createServer(app).listen(port, () => {
    console.log(`genomehubs-api started on http port ${port}`);
  });
}

export default app;

module.exports = app;
