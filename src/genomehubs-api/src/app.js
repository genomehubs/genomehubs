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
// Statically include generated handlers map when available so bundlers embed it.
// The generator writes to ./generated/operation-handlers.cjs
import bundledHandlersMap from "./generated/operation-handlers.cjs";

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

// Health endpoint for Docker HEALTHCHECK and readiness probes
app.get("/health", async (req, res) => {
  const health = { ok: true };
  // optional: check Elasticsearch connectivity
  try {
    if (config.node) {
      // lazy-load elastic client to avoid startup cost when not needed
      try {
        // require instead of import to work with bundled cjs/esm shapes
        // eslint-disable-next-line global-require
        const { Client } = require("@elastic/elasticsearch");
        const client = new Client({ node: config.node });
        await client.ping();
        health.elasticsearch = "ok";
      } catch (err) {
        health.elasticsearch = "error";
        health.ok = false;
      }
    }
  } catch (err) {
    health.ok = false;
  }
  res.status(health.ok ? 200 : 503).json(health);
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
  // Prefer the statically imported handlers map (bundled) when available.
  let handlersMap = bundledHandlersMap || null;
  let handlersMapSource = "none";
  if (!handlersMap) {
    try {
      handlersMap = require(path.join(
        __dirname,
        "..",
        "src",
        "generated",
        "operation-handlers.cjs"
      ));
      handlersMapSource = "src/generated";
    } catch (e) {
      // fall back to build/operation-handlers.cjs if present
      try {
        handlersMap = require(path.join(
          __dirname,
          "..",
          "build",
          "operation-handlers.cjs"
        ));
        handlersMapSource = "build";
      } catch (e2) {
        handlersMap = null;
      }
    }
  } else {
    handlersMapSource = "bundled-import";
  }
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
    // helper: unwrap nested default exports (common after bundling / ESM interop)
    const unwrapExport = (m) => {
      let cur = m;
      // follow .default chains up to a small depth to avoid infinite loops
      for (
        let i = 0;
        i < 5 && cur && typeof cur === "object" && cur.default;
        i++
      ) {
        cur = cur.default;
      }
      return cur;
    };

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
        // try to unwrap nested default exports first
        mod = unwrapExport(mod) || mod;
        // Prefer explicit function name from OpenAPI (x-eov-operation-id or operationId)
        try {
          const fnName =
            schema && (schema["x-eov-operation-id"] || schema["operationId"]);
          if (fnName && mod) {
            // 1) Named export on the module namespace
            if (typeof mod[fnName] === "function") {
              return mod[fnName];
            }
            // 2) Named export on the default export (common when CJS->ESM interop happened)
            if (mod.default && typeof mod.default[fnName] === "function") {
              return mod.default[fnName];
            }
          }
        } catch (e) {
          // ignore named export resolution errors
        }

        // Handler may be exported directly as a function (CJS) or as default (ESM interop)
        try {
          // quick resolution attempts (prefer explicit names)
          if (typeof mod === "function") {
            return mod;
          }
          if (mod && typeof mod.default === "function") {
            return mod.default;
          }
          if (mod && typeof mod.handler === "function") {
            return mod.handler;
          }

          // If module is an object, try to pick a sensible function export (e.g. getSearchResultCount)
          if (mod && typeof mod === "object") {
            const fnKey = Object.keys(mod).find(
              (k) => typeof mod[k] === "function"
            );
            if (fnKey) {
              return mod[fnKey];
            }
            // try inside default namespace too
            if (mod.default && typeof mod.default === "object") {
              const inner = Object.keys(mod.default).find(
                (k) => typeof mod.default[k] === "function"
              );
              if (inner) {
                return mod.default[inner];
              }
            }
          }
        } catch (err) {
          // ignore fallback resolution errors
        }

        // If we reach here we didn't find a function to return synchronously.
        // Return a lazy wrapper function that will attempt the same resolution at
        // request-time and call the resolved function (so express-openapi-validator
        // always receives a function). This avoids the validator receiving an object
        // and causing the "argument handler must be a function" error.
        return function lazyOperationHandler(req, res, next) {
          try {
            // prefer operation-specific name if available
            const fnName =
              schema && (schema["x-eov-operation-id"] || schema.operationId);
            let fn = null;
            try {
              if (fnName && mod && typeof mod[fnName] === "function")
                fn = mod[fnName];
              if (
                !fn &&
                fnName &&
                mod &&
                mod.default &&
                typeof mod.default[fnName] === "function"
              )
                fn = mod.default[fnName];
            } catch (e) {}

            if (!fn) {
              if (typeof mod === "function") fn = mod;
              else if (mod && typeof mod.default === "function")
                fn = mod.default;
              else if (mod && typeof mod.handler === "function")
                fn = mod.handler;
              else if (mod && typeof mod === "object") {
                const k = Object.keys(mod).find(
                  (x) => typeof mod[x] === "function"
                );
                if (k) fn = mod[k];
                else if (mod.default && typeof mod.default === "object") {
                  const inner = Object.keys(mod.default).find(
                    (x) => typeof mod.default[x] === "function"
                  );
                  if (inner) fn = mod.default[inner];
                }
              }
            }

            if (typeof fn === "function") {
              return fn.call(this, req, res, next);
            }

            const msg = `Operation handler function not found for key=${key} fnName=${fnName}`;
            next(new Error(msg));
          } catch (err) {
            next(err);
          }
        };
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
