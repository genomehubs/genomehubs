import { createAction, handleAction } from "redux-actions";

export const setHighlightPointLocation = createAction(
  "SET_HIGHLIGHT_POINT_LOCATION",
);

export const highlightPointLocation = handleAction(
  "SET_HIGHLIGHT_POINT_LOCATION",
  (state, action) => action.payload,
  false,
);

export const getHighlightPointLocation = (state) =>
  state.highlightPointLocation;

export const setZoomPointLocation = createAction("SET_ZOOM_POINT_LOCATION");

export const zoomPointLocation = handleAction(
  "SET_ZOOM_POINT_LOCATION",
  (state, action) => action.payload,
  false,
);

export const getZoomPointLocation = (state) => state.zoomPointLocation;

export const geographyReducers = {
  highlightPointLocation,
  zoomPointLocation,
};
