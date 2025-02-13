import * as OpenApiValidator from "express-openapi-validator";

import YAML from "yamljs";
// import { cache } from "./api/v2/functions/cache.js";
import compression from "compression";
import { config } from "./api/v2/functions/config.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import esmResolver from "./api/v2/functions/esmResolver.js";
import express from "express";
import { fileURLToPath } from "url";
import fs from "fs";
import helmet from "helmet";
import http from "http";
import https from "https";
import { logAccess } from "./api/v2/functions/logger.js";
import { logError } from "./api/v2/functions/logger.js";
import path from "path";
import qs from "./api/v2/functions/qs.js";
import swaggerUi from "swagger-ui-express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { port } = config;
const apiSpec = path.join(__dirname, "api-v2.yaml");

let swaggerDocument = YAML.load(apiSpec);
// TODO: restore customisation options
// swaggerDocument.info.description = config.description;
// swaggerDocument.info.title = config.title;
// swaggerDocument.info.version = config.url.replace(/.+\//, "");
// swaggerDocument.info.contact.name = config.contactName;
// swaggerDocument.info.contact.email = config.contactEmail;
swaggerDocument.info.version = "v2";
swaggerDocument.components.parameters.taxonomyParam.schema.default =
  config.taxonomy;
swaggerDocument.servers[0].url = config.url;
// Temporarily redirect old API requests to v2
if (config.url.match("v2")) {
  swaggerDocument.servers[1] = { ...swaggerDocument.servers[0] };
  swaggerDocument.servers[1].url = config.url.replace("v2", "v0.0.1");
}

const swaggerOptions = {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: `${config.title} API`,
};

const app = express();
app.use(compression());
if (config.cors) {
  app.use(cors(config.cors));
}

app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  logAccess({ req });
  next();
});
// app.use(express.static(path.join(__dirname, "public")));
app.get("/api-spec", function (req, res) {
  res.header("Content-Type", "text/yaml");
  res.send(YAML.stringify(swaggerDocument, 8, 4));
});
if (process.pkg) {
  app.use(express.static(path.join(__dirname, "api-docs")));
  // serve swagger-ui.css directly as static path above only works for js
  app.get("/api-docs/swagger-ui.css", function (req, res) {
    res.header("Content-Type", "text/css");
    res.sendFile(path.join(__dirname, "api-docs", "swagger-ui.css"));
  });
}

// uncomment to use shortened URLs
// const expandQuery = function (req, res, next) {
//   if (req.query) {
//     req.query = qs.expand(req.query);
//   }
//   next();
// };
// app.use(expandQuery);

// rename xInY to arc
const expandQuery = function (req, res, next) {
  if (req.query) {
    req.query = qs.expand(req.query);
  }
  next();
};
app.use(expandQuery);

// Modify swagger setup to prevent petstore being served in production
// app.use(
//   "/api-docs",
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerDocument, swaggerOptions)
// );
const swaggerSetup = swaggerUi.setup(swaggerDocument, swaggerOptions);
app.get("/api-docs/index.html", swaggerSetup);
app.use("/api-docs", swaggerUi.serve);
app.get("/api-docs", swaggerSetup);

app.use(
  OpenApiValidator.middleware({
    apiSpec: swaggerDocument,
    validateRequests: {
      allowUnknownQueryParameters: true,
      removeAdditional: "failing",
    },
    validateResponses: true,
    operationHandlers: esmResolver(path.join(__dirname)),
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

app.use(helmet());

if (config.https) {
  const options = {
    key: fs.readFileSync(config.keyFile),
    cert: fs.readFileSync(config.certFile),
  };
  https.createServer(options, app).listen(port, () => {
    console.log(`genomehubs-api started on https port ${port}`);
  });
} else {
  http.createServer(app).listen(port, () => {
    console.log(`genomehubs-api started on http port ${port}`);
  });
}

export default app;

export { app };
