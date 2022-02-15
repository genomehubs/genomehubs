import { createAction, handleAction, handleActions } from "redux-actions";

import immutableUpdate from "immutable-update";

export const requestReport = createAction("REQUEST_REPORT");
export const receiveReport = createAction(
  "RECEIVE_REPORT",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);
export const resetReport = createAction("RESET_REPORT");

const defaultReportState = () => ({
  isFetching: false,
  requestedById: {},
  allIds: [],
  byId: {},
});

function onReceiveReport(state, action) {
  const { payload, meta } = action;
  const { json, reportId } = payload;
  const { status, report } = json;

  const updatedWithReportState = immutableUpdate(state, {
    byId: { [reportId]: report },
  });

  const updatedWithReportList = immutableUpdate(updatedWithReportState, {
    allIds: [...new Set(updatedWithReportState.allIds.concat(reportId))],
  });

  const updatedWithMeta = immutableUpdate(updatedWithReportList, {
    isFetching: false,
    status,
    lastUpdated: meta.receivedAt,
  });
  return updatedWithMeta;
}

const reports = handleActions(
  {
    REQUEST_REPORT: (state, action) =>
      immutableUpdate(state, {
        isFetching: true,
        requestedById: immutableUpdate(state, {
          [action.payload]: true,
        }),
      }),
    RECEIVE_REPORT: onReceiveReport,
    RESET_REPORT: defaultReportState,
  },
  defaultReportState()
);

export const getReports = (state) => {
  return state.reports.byId;
};
export const getReportsFetching = (state) => state.reports.requestedById;

export const setReportTerm = createAction("SET_REPORT_TERM");
export const reportTerm = handleAction(
  "SET_REPORT_TERM",
  (state, action) => action.payload || false,
  false
);
export const getReportTerm = (state) => state.reportTerm;

export const setReportEdit = createAction("SET_REPORT_EDIT");
export const reportEdit = handleAction(
  "SET_REPORT_EDIT",
  (state, action) => action.payload || false,
  false
);
export const getReportEdit = (state) => state.reportEdit;

export const reportReducers = {
  reports,
  reportEdit,
  reportTerm,
};
