import { Provider } from "react-redux";
import React from "react";
import { configureStore } from "@reduxjs/toolkit";
import { enableBatching } from "redux-batched-actions";
import { render } from "@testing-library/react";
import rootReducer from "../client/views/reducers/root";

/**
 * Create a test Redux store with sensible defaults
 * Uses the actual root reducer from the app
 * Can be overridden with initialState for specific tests
 */
export function createTestStore(initialState = {}) {
  return configureStore({
    reducer: enableBatching(rootReducer),
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }),
  });
}

/**
 * Render component with Redux Provider
 * Usage: renderWithStore(<Component />, { search: { queryTerms: [...] } })
 */
export function renderWithStore(
  ui,
  {
    initialState = {},
    store = createTestStore(initialState),
    ...renderOptions
  } = {},
) {
  function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    store,
  };
}
