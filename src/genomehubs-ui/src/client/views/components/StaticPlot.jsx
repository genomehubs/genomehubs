import React, { useEffect, useRef } from "react";

import StaticPlotFiles from "./StaticPlotFiles";
import classnames from "classnames";
import { compose } from "recompose";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import withAnalysesByAnyId from "../hocs/withAnalysesByAnyId";
import withAnalysis from "../hocs/withAnalysis";

const StaticPlot = ({
  recordId,
  plot,
  result,
  analyses,
  analysisQueries,
  fetchAnalyses,
  taxonomy,
}) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );
  const containerRef = useRef(null);

  useEffect(() => {
    let query = `${result}_id==${recordId}`;
    let options = { query, result: "analysis", taxonomy };
    if (!analyses.isFetching && !analysisQueries[qs.stringify(options)]) {
      fetchAnalyses(options);
    }
  }, [recordId, analysisQueries]);

  let analysisId;
  if (analyses && analyses.byId && Object.keys(analyses.byId).length > 0) {
    analysisId = analyses.byId[Object.keys(analyses.byId)[0]].analysis_id;
  }

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <StaticPlotFiles
        analysisId={analysisId}
        containerRef={containerRef}
        filenames={plot && plot.split(",")}
      />
    </div>
  );
};

export default compose(withAnalysesByAnyId, withAnalysis)(StaticPlot);
