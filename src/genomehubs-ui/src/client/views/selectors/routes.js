import { getRoutes } from "../reducers/routes";

import { createCachedSelector } from "re-reselect";

const processRoutes = (routes, RouteName) => {
  let route = routes.byId[RouteName];
  if (!route) return undefined;
  return route;
};

export const getRoutesById = createCachedSelector(
  getRoutes,
  (_state, RouteName) => RouteName,
  (routes, RouteName) => processRoutes(routes, RouteName)
)((_state, RouteName) => RouteName);
