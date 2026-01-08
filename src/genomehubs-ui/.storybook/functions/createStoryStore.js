import { combineReducers, configureStore } from "@reduxjs/toolkit";

import { enableBatching } from "redux-batched-actions";

/**
 * @param {Object[]} reducerModules - Array of reducer objects to combine
 * @returns {Object} Configured Redux store
 * @example
 * Usage:const storyStore = createStoryStore([colorReducers, phylopicReducers]);
 */
export const createStoryStore = (reducerModules) => {
  const combinedReducers = {};
  reducerModules.forEach((module) => {
    Object.assign(combinedReducers, module);
  });

  const rootReducer = combineReducers(combinedReducers);

  return configureStore({
    reducer: enableBatching(rootReducer),
  });
};
