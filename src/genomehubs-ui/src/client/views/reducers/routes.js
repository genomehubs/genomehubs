import { createSlice } from "@reduxjs/toolkit";

const routesSlice = createSlice({
  name: "routes",
  initialState: { allIds: [], byId: {} },
  reducers: {
    setRoutes(state, action) {
      state.byId[action.payload.routeName] = action.payload;
      state.allIds.push(action.payload.routeName);
    },
  },
});

export const getRoutes = (state) => state.routes;

export const { setRoutes } = routesSlice.actions;

// Export the slice reducer as the default export
export default routesSlice.reducer;

export const routeReducers = {
  routes: routesSlice.reducer,
};
