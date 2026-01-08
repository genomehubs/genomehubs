import { configureStore } from "@reduxjs/toolkit";
import { createLogger } from "redux-logger";
import { enableBatching } from "redux-batched-actions";
import rootReducer from "./reducers/root";
import { thunk as thunkMiddleware } from "redux-thunk";

const loggerMiddleware = createLogger();

let timer;

const loadingMiddleWare = (store) => (next) => (action) => {
  if (!store.getState().loading) {
    return next(action);
  }
  if (action.type === "SET_LOADING") {
    return next(action);
  }
  clearTimeout(timer);
  timer = setTimeout(() => {
    store.dispatch({ type: "SET_LOADING", payload: "finished" });
  }, 1000);
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
