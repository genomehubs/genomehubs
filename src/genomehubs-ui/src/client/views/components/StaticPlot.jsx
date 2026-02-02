import { useEffect, useRef } from "react";

import StaticPlotFiles from "./StaticPlotFiles";
import { compose } from "redux";
import getPrimaryAssemblyId from "#functions/getPrimaryAssemblyId";
import qs from "#functions/qs";
import withAnalysesByAnyId from "#hocs/withAnalysesByAnyId";
import withAnalysis from "#hocs/withAnalysis";
import withRecord from "#hocs/withRecord";

const StaticPlot = ({
  recordId,
  plot,
  record,
  result,
  analyses,
  analysisQueries,
  fetchAnalyses,
  resetAnalyses,
  taxonomy,
}) => {
  const containerRef = useRef(null);
  let assemblyId = getPrimaryAssemblyId(record);

  useEffect(() => {
    let query = `assembly_id==${assemblyId}`;
    let options = { query, result: "analysis", taxonomy };
    if (!analyses.isFetching && !analysisQueries[qs.stringify(options)]) {
      fetchAnalyses(options);
    }
  }, [recordId, record, analysisQueries]);
  let analysisId;
  if (analyses && analyses.byAssemblyId && analyses.byAssemblyId[assemblyId]) {
    analysisId =
      analyses.byId[analyses.byAssemblyId[assemblyId].allIds[0]].analysis_id;
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", padding: "0.5em 0 1em" }}
    >
      <StaticPlotFiles
        analysisId={analysisId}
        containerRef={containerRef}
        filenames={plot && plot.split(",")}
      />
    </div>
  );
};

export default compose(
  withAnalysesByAnyId,
  withAnalysis,
  withRecord,
)(StaticPlot);
