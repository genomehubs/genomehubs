import {
  cancelAnalyses,
  getAnalyses,
  getAnalysisQueries,
  resetAnalyses,
} from "#reducers/analysis";

import React from "react";
import { connect } from "react-redux";
import { fetchAnalyses } from "#selectors/analysis";

const withAnalysis = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    analyses: getAnalyses(state),
    analysisQueries: getAnalysisQueries(state),
  });
  const mapDispatchToProps = (dispatch) => ({
    fetchAnalyses: (options) => dispatch(fetchAnalyses(options)),
    cancelAnalyses: () => dispatch(cancelAnalyses()),
    resetAnalyses: () => dispatch(resetAnalyses()),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withAnalysis;
