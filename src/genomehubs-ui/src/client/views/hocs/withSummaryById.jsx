import React from "react";
import { connect } from "react-redux";
import { getSummaryBySummaryId } from "#selectors/explore";

const withSummaryById = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    ...(props.summaryId && {
      summaryById: getSummaryBySummaryId(state, props.summaryId),
    }),
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withSummaryById;
