import React from "react";
import { connect } from "react-redux";
import { getReportByReportId } from "#selectors/report";

const withReportById = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    ...(props.reportId && {
      reportById: getReportByReportId(state, props.reportId),
    }),
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withReportById;
