import { createAction, handleAction } from "redux-actions";

export const setLoading = createAction("SET_LOADING");
export const loading = handleAction(
  "SET_LOADING",
  (_, action) => action.payload,
  "started",
);
export const getLoading = (state) => {
  return state.loading;
};

export const loadingReducers = {
  loading,
};
