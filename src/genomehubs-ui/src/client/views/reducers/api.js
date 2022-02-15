import { createAction, handleAction } from "redux-actions";

export const apiUrl = API_URL || "/api/v1";

export const setApiStatus = createAction("SET_API_STATUS");
export const apiStatus = handleAction(
  "SET_API_STATUS",
  (state, action) => action.payload,
  true
);
export const getApiStatus = (state) => state.apiStatus;

export const apiReducers = {
  apiStatus,
};
