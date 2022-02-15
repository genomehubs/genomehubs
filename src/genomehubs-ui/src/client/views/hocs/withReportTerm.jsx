import {
  getReportEdit,
  getReportTerm,
  setReportEdit,
  setReportTerm,
} from "../reducers/report";

import React from "react";
import { connect } from "react-redux";

const withReportTerm = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    reportEdit: getReportEdit(state),
    reportTerm: getReportTerm(state),
  });
  const mapDispatchToProps = (dispatch) => ({
    setReportEdit: (term) => dispatch(setReportEdit(term)),
    setReportTerm: (term) => dispatch(setReportTerm(term)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withReportTerm;
