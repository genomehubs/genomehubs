import path from "path";

const esmResolver = (basePath) => {
  return {
    basePath,
    resolver: (basePath, route, apiDoc) => {
      const pathKey = route.openApiRoute.substring(route.basePath.length);
      const schema = apiDoc.paths[pathKey][route.method.toLowerCase()];

      // x-eov-operation-id takes priority over operationId
      const fn = schema["x-eov-operation-id"] || schema["operationId"];

      // x-eov-operation-handler with fallback to routes.js
      const handler = schema["x-eov-operation-handler"] || "routes";

      const handlerFile = `${handler}.js`;
      const modP = import(path.join(basePath, handlerFile));

      return async (req, res, next) => {
        try {
          const mod = await modP;
          mod[fn](req, res);
        } catch (err) {
          console.error(err);
          next(new Error(`Routing error ${handlerFile}:${fn}`));
        }
      };
    },
  };
};

export default esmResolver;
