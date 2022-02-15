import { applyMiddleware, createStore } from "redux";

import { createLogger } from "redux-logger";
import { enableBatching } from "redux-batched-actions";
import rootReducer from "./reducers/root";
import thunkMiddleware from "redux-thunk";

const loggerMiddleware = createLogger();

const store = createStore(
  enableBatching(rootReducer),
  applyMiddleware(
    // loggerMiddleware,
    thunkMiddleware
  )
);

export default store;
