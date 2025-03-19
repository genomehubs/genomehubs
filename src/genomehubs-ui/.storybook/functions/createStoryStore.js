import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { enableBatching } from "redux-batched-actions";
import { thunk as thunkMiddleware } from "redux-thunk";

/**
 * @param {Object[]} reducerModules - Array of reducer objects to combine
 * @returns {Object} Configured Redux store
 * @example
 * Usage:const storyStore = createStoryStore([colorReducers, phylopicReducers]);
 */
export const createStoryStore = (reducerModules) => {
  const combinedReducers = {};
  reducerModules.forEach(module => {
    Object.assign(combinedReducers, module);
  });
  
  const rootReducer = combineReducers(combinedReducers);

  return configureStore({
    reducer: enableBatching(rootReducer),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(thunkMiddleware),
  });
};