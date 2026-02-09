import { configureStore } from "@reduxjs/toolkit";
import { createLogger } from "redux-logger";
import { enableBatching } from "redux-batched-actions";
import rootReducer from "./reducers/root";
import { thunk as thunkMiddleware } from "redux-thunk";

const loggerMiddleware = createLogger();

let timer;
let actionCount = 0;
let lastActionTime = Date.now();

const loadingMiddleWare = (store) => (next) => (action) => {
  const currentLoading = store.getState().loading;

  // Don't intercept if loading is already finished or false
  if (!currentLoading || currentLoading === "finished") {
    return next(action);
  }

  // Don't intercept SET_LOADING actions
  if (action.type === "SET_LOADING") {
    return next(action);
  }

  // Track action activity
  actionCount++;
  lastActionTime = Date.now();

  // Clear existing timer
  clearTimeout(timer);

  // Wait for a period of inactivity before dismissing loading screen
  // This ensures all async operations (data fetches, component mounts) complete
  // Longer timeout (2 seconds) gives slow connections time to load critical content
  timer = setTimeout(() => {
    const timeSinceLastAction = Date.now() - lastActionTime;
    // Only dismiss if we've had at least a few actions (initial hydration happened)
    // and there's been sufficient quiet time
    if (actionCount > 2 && timeSinceLastAction >= 2000) {
      store.dispatch({ type: "SET_LOADING", payload: "finished" });
      // Reset counters for next navigation
      actionCount = 0;
    }
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
