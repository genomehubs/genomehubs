import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { enableBatching } from "redux-batched-actions";
import { thunk as thunkMiddleware } from "redux-thunk";
import { colorReducers } from "./color";
import { phylopicReducers } from "./phylopic";

const rootReducer = combineReducers({
  ...colorReducers,
  ...phylopicReducers,
});

const store = configureStore({
  reducer: enableBatching(rootReducer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(thunkMiddleware),
});

export default store;
