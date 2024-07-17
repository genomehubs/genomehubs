import { applyMiddleware, createStore } from "redux";

import { createLogger } from "redux-logger";
import { enableBatching } from "redux-batched-actions";
import rootReducer from "./reducers/root";
import thunkMiddleware from "redux-thunk";

const loggerMiddleware = createLogger();

let timer;

const customMiddleWare = (store) => (next) => (action) => {
  if (!store.getState().loading) {
    return;
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

const store = createStore(
  enableBatching(rootReducer),
  applyMiddleware(
    // loggerMiddleware,
    thunkMiddleware,
    customMiddleWare
  )
);

export default store;
