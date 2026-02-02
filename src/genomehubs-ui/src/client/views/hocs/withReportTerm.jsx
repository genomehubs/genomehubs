import {
  getReportEdit,
  getReportSelect,
  getReportTerm,
  setReportEdit,
  setReportSelect,
  setReportTerm,
} from "#reducers/report";

import { connect } from "react-redux";

const withReportTerm = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    reportEdit: getReportEdit(state),
    reportSelect: getReportSelect(state),
    reportTerm: getReportTerm(state),
  });
  const mapDispatchToProps = (dispatch) => ({
    setReportEdit: (term) => dispatch(setReportEdit(term)),
    setReportSelect: (level) => dispatch(setReportSelect(level)),
    setReportTerm: (term) => dispatch(setReportTerm(term)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withReportTerm;
