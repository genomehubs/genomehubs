import { createAction, handleAction, handleActions } from "redux-actions";

export const setMessage = createAction("SET_MESSAGE");
export const message = handleAction(
  "SET_MESSAGE",
  (state, action) => action.payload,
  false
);
export const getMessage = (state) => state.message;

export const resetController = createAction("RESET_CONTROLLER");
export const controller = handleAction(
  "RESET_CONTROLLER",
  (state, action) => new AbortController(),
  new AbortController()
);
export const getController = (state) => state.controller;

export const messageReducers = {
  controller,
  message,
};
