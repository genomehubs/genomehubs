import { createAction, handleAction } from "redux-actions";

export const getApiURL = () => {
  if (
    window &&
    window.process &&
    window.process.ENV &&
    window.process.ENV.GH_API_URL
  ) {
    return window.process.ENV.GH_API_URL;
  }
  return API_URL || "api/v1";
};

export const apiUrl = getApiURL();

export const setApiStatus = createAction("SET_API_STATUS");
export const apiStatus = handleAction(
  "SET_API_STATUS",
  (state, action) => action.payload,
  true
);
export const getApiStatus = (state) => state.apiStatus;

export const setApiAttempt = createAction("SET_API_ATTEMPT");
export const apiAttempt = handleAction(
  "SET_API_ATTEMPT",
  (state, action) => action.payload,
  1
);
export const getApiAttempt = (state) => state.apiAttempt;

export const apiReducers = {
  apiAttempt,
  apiStatus,
};
