import { createAction, handleAction, handleActions } from "redux-actions";

export const setCookieConsent = createAction("SET_COOKIE_CONSENT");

export const cookieConsent = handleAction(
  "SET_COOKIE_CONSENT",
  (state, action) => action.payload,
  false
);

export const getCookieConsent = (state) => state.cookieConsent;

export const trackingReducers = {
  cookieConsent,
};
