import React, { useEffect } from "react";

import AnalysisTableRow from "./AnalysisTableRow";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import classnames from "classnames";
import { compose } from "recompose";
import qs from "qs";
import styles from "./Styles.scss";
import withAnalysesByAnyId from "../hocs/withAnalysesByAnyId";
import withAnalysis from "../hocs/withAnalysis";

const AnalysisPanel = ({
  recordId,
  result,
  analyses,
  analysesByAssemblyId,
  analysesByTaxonId,
  analysisQueries,
  fetchAnalyses,
  taxonomy,
}) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );
  const analysesByRecordId = {
    assembly: analysesByAssemblyId,
    taxon: analysesByTaxonId,
  };

  useEffect(() => {
    let query = `${result}_id==${recordId}`;
    let options = { query, result: "analysis", taxonomy };
    if (!analyses.isFetching && !analysisQueries[qs.stringify(options)]) {
      fetchAnalyses(options);
    }
  }, [recordId, analysisQueries]);

  let analysisTable;
  if (analysesByRecordId[result]) {
    let tableRows = analysesByRecordId[result].map((analysis) => {
      return (
        <AnalysisTableRow
          analysisId={analysis.analysis_id}
          currentResult={result}
          meta={analysis}
          key={analysis.analysis_id}
        />
      );
    });
    analysisTable = (
      <Table size={"small"} className={styles.autoWidth}>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Files</TableCell>
            <TableCell>Assemblies</TableCell>
            <TableCell>Taxa</TableCell>
            <TableCell>Source</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{tableRows}</TableBody>
      </Table>
    );
  }
  return (
    <div className={css}>
      <div className={styles.header}>
        <span className={styles.title}>Analyses</span>
      </div>
      <div>{analysisTable}</div>
    </div>
  );
};

export default compose(withAnalysesByAnyId, withAnalysis)(AnalysisPanel);
