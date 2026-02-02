import { colorReducers } from "./color";
import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { enableBatching } from "redux-batched-actions";

const allReducers = Object.assign({}, colorReducers);

const appReducer = combineReducers(allReducers);

const store = configureStore({
  reducer: enableBatching(appReducer),
});

export default store;
