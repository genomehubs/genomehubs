import { configureStore } from "@reduxjs/toolkit";
import { createLogger } from "redux-logger";
import { enableBatching } from "redux-batched-actions";
import rootReducer from "./reducers/root";
import { thunk as thunkMiddleware } from "redux-thunk";

const loggerMiddleware = createLogger();

let timer;
let criticalResourcesLoaded = {
  hasActions: false,
};

const loadingMiddleWare = (store) => (next) => (action) => {
  if (!store.getState().loading) {
    return next(action);
  }
  if (action.type === "SET_LOADING") {
    return next(action);
  }

  // Mark that we've started processing actions (initial hydration complete)
  criticalResourcesLoaded.hasActions = true;

  // Clear existing timer
  clearTimeout(timer);

  // Wait for multiple actions to complete before dismissing loading screen
  // This ensures:
  // 1. Initial Redux state is hydrated
  // 2. Components have mounted and fetched their data
  // 3. User sees loading screen while meaningful content loads
  // After first action: wait 2 seconds for subsequent actions
  // If no more actions come, loading screen will dismiss
  timer = setTimeout(() => {
    store.dispatch({ type: "SET_LOADING", payload: "finished" });
    // Reset for next page load
    criticalResourcesLoaded = { hasActions: false };
  }, 2000);

  next(action);
};

// const store = createStore(
//   enableBatching(rootReducer),
//   applyMiddleware(
//     // loggerMiddleware,
//     thunkMiddleware,
//     loadingMiddleWare
//   )
// );

const store = configureStore({
  reducer: enableBatching(rootReducer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat(loadingMiddleWare),
});

export default store;
