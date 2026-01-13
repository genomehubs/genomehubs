import React from "react";
import { connect } from "react-redux";
import { getFilesByAnalysisId } from "#selectors/file";

const withFilesByAnalysisId = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    ...(props.analysisId && {
      filesByAnalysisId: getFilesByAnalysisId(state, props.analysisId),
    }),
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withFilesByAnalysisId;
