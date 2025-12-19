import * as OpenApiValidator from "express-openapi-validator";

import YAML from "yamljs";
// import { cache } from "./api/v2/functions/cache.js";
import compression from "compression";
import { config } from "./api/v2/functions/config.js";
import cookieParser from "cookie-parser";
import cors from "cors";
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

// ensure all route/report modules are statically imported into the bundle
// generated at build time by scripts/generate-all-routes.cjs -> src/all_routes.js
// this file is a no-op at runtime but forces bundlers to include modules that
// would otherwise be dynamically required by express-openapi-validator.
(async () => {
  try {
    await import(path.join(__dirname, "all_routes.js"));
  } catch (err) {
    // ignore; file may not exist in some dev environments
  }
})();

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
    const expanded = qs.expand(req.query);
    // expose expanded query broadly so downstream handlers can access renamed params
    res.locals.expandedQuery = expanded;
    req.expandedQuery = expanded;

    // Try to mutate the existing req.query object if it's mutable
    try {
      if (typeof req.query === "object" && req.query !== null) {
        Object.keys(req.query).forEach((k) => {
          if (!(k in expanded)) delete req.query[k];
        });
        Object.keys(expanded).forEach((k) => {
          req.query[k] = expanded[k];
        });
      }
    } catch (err) {
      // ignore: we'll try to define a concrete property below or rely on the fallbacks
    }

    // Try to define an own `query` property on the request object that returns the expanded object.
    // This will shadow Express's getter for `query` for this request instance if configurable.
    try {
      const currentDesc = Object.getOwnPropertyDescriptor(req, "query");
      if (!currentDesc || currentDesc.configurable !== false) {
        Object.defineProperty(req, "query", {
          configurable: true,
          enumerable: true,
          value: expanded,
          writable: true,
        });
      }
    } catch (err) {
      // If defining the property fails, we rely on `req.expandedQuery` and `res.locals.expandedQuery`.
    }
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

// Try to use a generated static operation handlers map to avoid dynamic requires at runtime.
let operationHandlersPath = null;
try {
  // generated at build time by scripts/generate-operation-handlers.cjs -> build/operation-handlers.cjs
  const handlersMap = require(path.join(
    __dirname,
    "..",
    "build",
    "operation-handlers.cjs"
  ));
  // custom resolver: expects handlersPath to be the project src root; module keys are relative to src
  const staticResolver = (handlersPath, route, apiDoc) => {
    const schema =
      apiDoc.paths[route.openApiRoute.substring(route.basePath.length)][
        route.method.toLowerCase()
      ];
    const baseName =
      schema["x-eov-operation-han dler"] ||
      schema["x-eov-operation-handler"] ||
      schema["x-eov-operation-handler"];
    // debug logging to inspect what handlersMap contains
    try {
      if (baseName) {
        const keyDbg = baseName;
        const value = handlersMap && handlersMap[keyDbg];
        console.log("OP_HANDLER_DEBUG: baseName=", baseName);
        console.log("OP_HANDLER_DEBUG: key=", keyDbg);
        console.log("OP_HANDLER_DEBUG: valueType=", typeof value);
        if (value && typeof value === "object") {
          try {
            console.log("OP_HANDLER_DEBUG: valueKeys=", Object.keys(value));
          } catch (e) {}
          if (value && value.default) {
            console.log(
              "OP_HANDLER_DEBUG: value.defaultType=",
              typeof value.default
            );
            try {
              console.log(
                "OP_HANDLER_DEBUG: value.defaultKeys=",
                Object.keys(value.default)
              );
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.log(
        "OP_HANDLER_DEBUG: resolver logging error",
        err && err.message
      );
    }
    // operationHandlers generator used module keys relative to src. if baseName is present, map to that module.
    if (baseName && handlersMap) {
      // baseName is expected to be a path like 'api/v2/controllers/foo'
      const key = baseName;
      // try several candidate key forms: as provided, and with a .js suffix
      const candidates = [key, `${key}.js`];
      let mod;
      for (const k of candidates) {
        if (
          handlersMap &&
          Object.prototype.hasOwnProperty.call(handlersMap, k)
        ) {
          mod = handlersMap[k];
          break;
        }
      }
      if (mod) {
        // Prefer explicit function name from OpenAPI (x-eov-operation-id or operationId)
        try {
          const fnName =
            schema && (schema["x-eov-operation-id"] || schema["operationId"]);
          if (fnName && mod && typeof mod[fnName] === "function") {
            console.log("OP_HANDLER_DEBUG: resolvedToNamedExport=", fnName);
            return mod[fnName];
          }
        } catch (e) {
          // ignore
        }
        // Handler may be exported as CommonJS function, ESM default, or named property.
        if (typeof mod === "function") return mod;
        if (mod && typeof mod.default === "function") return mod.default;
        if (mod && typeof mod.handler === "function") return mod.handler;
        // If module is an object, try to pick a sensible function export (e.g. getResultFields)
        try {
          if (mod && typeof mod === "object") {
            const fnKey = Object.keys(mod).find(
              (k) => typeof mod[k] === "function"
            );
            if (fnKey) {
              console.log("OP_HANDLER_DEBUG: pickedExport=", fnKey);
              return mod[fnKey];
            }
          }
        } catch (err) {
          // ignore and fall through to return mod
        }
        // Fallback: return the module and let the validator decide (may error)
        return mod;
      }
    }
    // fallback: let the validator do its default resolution
    return undefined;
  };
  operationHandlersPath = { resolver: staticResolver };
} catch (err) {
  // no generated map available; fall back to dynamic resolution
  operationHandlersPath = path.join(__dirname);
}

app.use(
  OpenApiValidator.middleware({
    apiSpec: swaggerDocument,
    validateRequests: {
      allowUnknownQueryParameters: true,
      removeAdditional: "failing",
    },
    validateResponses: true,
    operationHandlers: operationHandlersPath,
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
