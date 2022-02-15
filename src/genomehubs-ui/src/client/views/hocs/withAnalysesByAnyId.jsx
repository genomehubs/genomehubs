import {
  getAnalysesByAssemblyId,
  getAnalysesByTaxonId,
  getAnalysisById,
} from "../selectors/analysis";

import React from "react";
import { connect } from "react-redux";

const withAnalysesByAnyId = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    ...(props.analysisId && {
      analysis: getAnalysisById(state, props.analysisId),
    }),
    ...(props.assemblyId && {
      analysesByAssemblyId: getAnalysesByAssemblyId(state, props.assemblyId),
    }),
    ...(props.taxonId && {
      analysesByTaxonId: getAnalysesByTaxonId(state, props.taxonId),
    }),
    ...(props.result &&
      props.recordId &&
      props.result == "assembly" && {
        analysesByAssemblyId: getAnalysesByAssemblyId(state, props.recordId),
      }),
    ...(props.result &&
      props.recordId &&
      props.result == "taxon" && {
        analysesByTaxonId: getAnalysesByTaxonId(state, props.recordId),
      }),
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withAnalysesByAnyId;
