import { createAction, handleAction } from "redux-actions";
import immutableUpdate from "immutable-update";

export const setRoutes = createAction("SET_ROUTES");

export const routes = handleAction(
  "SET_ROUTES",
  (state, action) =>
    immutableUpdate(state, {
      byId: { [action.payload.routeName]: action.payload },
      allIds: [...state.allIds, action.payload.routeName],
    }),
  { allIds: [], byId: {} }
);
export const getRoutes = (state) => state.routes;

export const routeReducers = {
  routes,
};
