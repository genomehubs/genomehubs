import React from "react";
import { connect } from "react-redux";
import { getReportDefaults } from "#selectors/report";

const withReportDefaults = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    reportDefaults: getReportDefaults(state),
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withReportDefaults;
