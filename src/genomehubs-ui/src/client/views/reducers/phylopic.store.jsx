  import { phylopicReducers } from "./phylopic";
  import { combineReducers } from "redux";
  import { configureStore } from "@reduxjs/toolkit";
  import { enableBatching } from "redux-batched-actions";
  import { thunk as thunkMiddleware } from "redux-thunk";

  const allReducers = Object.assign({}, phylopicReducers);
  const store=configureStore({
    reducer:enableBatching(combineReducers(allReducers)),
    middleware:(getDefaultMiddleware)=>getDefaultMiddleware().concat(thunkMiddleware)
  });
  export default store;