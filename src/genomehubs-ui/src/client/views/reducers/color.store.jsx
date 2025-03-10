import { colorReducers } from "./color";
import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { enableBatching } from "redux-batched-actions";
import { thunk as thunkMiddleware } from "redux-thunk";

const allReducers = Object.assign({}, colorReducers);

const appReducer = combineReducers(allReducers);

const store = configureStore({
  reducer: enableBatching(appReducer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(thunkMiddleware),
});

export default store;
