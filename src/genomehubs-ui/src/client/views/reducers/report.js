import { createAction, handleAction } from "redux-actions";

import { createSlice } from "@reduxjs/toolkit";

const defaultReportState = () => ({
  isFetching: false,
  requestedById: {},
  allIds: [],
  byId: {},
});

const reportsSlice = createSlice({
  name: "reports",
  initialState: defaultReportState(),
  reducers: {
    requestReport(state, action) {
      state.isFetching = true;
      state.byId[action.payload.routeName] = action.payload;
      state.allIds.push(action.payload.routeName);
    },
    receiveReport(state, action) {
      const { json, reportId } = action.payload;
      const { status, report } = json;
      state.isFetching = false;
      state.status = status;
      state.lastUpdated = Date.now();
      state.byId[reportId] = report;
      state.allIds = [...new Set(state.allIds.concat(reportId))];
    },
    resetReport(state, action) {
      defaultReportState();
    },
  },
});

export const getReports = (state) => {
  return state.reports.byId;
};
export const getReportsFetching = (state) => state.reports.requestedById;

export const setReportTerm = createAction("SET_REPORT_TERM");
export const reportTerm = handleAction(
  "SET_REPORT_TERM",
  (state, action) => action.payload || false,
  false,
);
export const getReportTerm = (state) => state.reportTerm;

export const setReportEdit = createAction("SET_REPORT_EDIT");
export const reportEdit = handleAction(
  "SET_REPORT_EDIT",
  (state, action) => action.payload || false,
  false,
);
export const getReportEdit = (state) => state.reportEdit;

export const setReportSelect = createAction("SET_REPORT_SELECT");
export const reportSelect = handleAction(
  "SET_REPORT_SELECT",
  (state, action) => action.payload || "bin",
  "bin",
);
export const getReportSelect = (state) => state.reportSelect;

export const { receiveReport, requestReport, resetReport } =
  reportsSlice.actions;

export const reportReducers = {
  reports: reportsSlice.reducer,
  reportEdit,
  reportSelect,
  reportTerm,
};
