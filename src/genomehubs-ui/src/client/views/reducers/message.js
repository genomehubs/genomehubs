import { createAction, handleAction, handleActions } from "redux-actions";

window.controller = new AbortController();

export const resetController = () =>
  (window.controller = new AbortController());
export const setMessage = createAction("SET_MESSAGE");
export const message = handleAction(
  "SET_MESSAGE",
  (state, action) => action.payload,
  false,
);
export const getMessage = (state) => state.message;

export const messageReducers = {
  message,
};
