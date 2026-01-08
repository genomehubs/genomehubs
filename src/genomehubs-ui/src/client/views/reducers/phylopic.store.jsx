import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";
import { enableBatching } from "redux-batched-actions";
import { phylopicReducers } from "./phylopic";

const allReducers = Object.assign({}, phylopicReducers);
const store = configureStore({
  reducer: enableBatching(combineReducers(allReducers)),
});
export default store;
