import { fetchReport, saveReport } from "#selectors/report";
import {
  setReportEdit,
  setReportSelect,
  setReportTerm,
} from "#reducers/report";

import { connect } from "react-redux";

const dispatchReport = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});

  const mapDispatchToProps = (dispatch) => ({
    fetchReport: ({ reportId, queryString, reload, report, hideMessage }) =>
      dispatch(
        fetchReport({ reportId, queryString, reload, report, hideMessage }),
      ),
    saveReport: (props) => {
      dispatch(saveReport(props));
    },
    setReportEdit: (term) => dispatch(setReportEdit(term)),
    setReportSelect: (term) => dispatch(setReportSelect(term)),
    setReportTerm: (term) => dispatch(setReportTerm(term)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default dispatchReport;
