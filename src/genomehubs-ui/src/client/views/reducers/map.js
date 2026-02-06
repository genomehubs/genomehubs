import { createAction, handleAction, handleActions } from "redux-actions";

export const mapThreshold = MAP_THRESHOLD;

export const setMapThreshold = createAction("SET_MAP_THRESHOLD");
export const mapThresholdValue = handleAction(
  "SET_MAP_THRESHOLD",
  (state, action) => action.payload,
  mapThreshold,
);
export const getMapThreshold = (state) => state.mapThresholdValue;

export const mapReducers = {
  mapThresholdValue,
};
