import { describe, expect, it } from "vitest";

import { configureStore } from "@reduxjs/toolkit";

/**
 * Integration tests for Redux store configuration
 * Tests store setup, middleware, and basic Redux behavior
 * (Full root reducer tests will be added in Phase 1 with proper mocking)
 */
describe("Redux store configuration", () => {
  describe("store factory", () => {
    it("should create a valid Redux store", () => {
      const store = configureStore({
        reducer: {
          test: (state = { value: 0 }) => state,
        },
      });

      expect(store).toBeDefined();
      expect(store.dispatch).toBeDefined();
      expect(store.getState).toBeDefined();
    });

    it("should initialize with empty state", () => {
      const store = configureStore({
        reducer: {
          test: (state = {}) => state,
        },
      });

      const state = store.getState();
      expect(state.test).toEqual({});
    });

    it("should initialize with preloaded state", () => {
      const store = configureStore({
        reducer: {
          test: (state = { value: 0 }) => state,
        },
        preloadedState: {
          test: { value: 42 },
        },
      });

      const state = store.getState();
      expect(state.test.value).toBe(42);
    });
  });

  describe("store state consistency", () => {
    it("should return same state reference without dispatch", () => {
      const store = configureStore({
        reducer: {
          test: (state = { value: 0 }) => state,
        },
      });

      const state1 = store.getState();
      const state2 = store.getState();

      expect(state1).toBe(state2);
    });

    it("should return new state reference after dispatch", () => {
      const store = configureStore({
        reducer: {
          test: (state = { value: 0 }, action) => {
            if (action.type === "INCREMENT") {
              return { value: state.value + 1 };
            }
            return state;
          },
        },
      });

      const state1 = store.getState();
      store.dispatch({ type: "INCREMENT" });
      const state2 = store.getState();

      expect(state1).not.toBe(state2);
      expect(state1.test.value).toBe(0);
      expect(state2.test.value).toBe(1);
    });
  });

  describe("store middleware", () => {
    it("should handle thunk-like actions", () => {
      const store = configureStore({
        reducer: {
          test: (state = { loading: false, data: null }, action) => {
            if (action.type === "LOAD_START") {
              return { loading: true, data: null };
            }
            if (action.type === "LOAD_END") {
              return { loading: false, data: action.payload };
            }
            return state;
          },
        },
      });

      store.dispatch({ type: "LOAD_START" });
      let state = store.getState();
      expect(state.test.loading).toBe(true);

      store.dispatch({ type: "LOAD_END", payload: "success" });
      state = store.getState();
      expect(state.test.loading).toBe(false);
      expect(state.test.data).toBe("success");
    });
  });
});
