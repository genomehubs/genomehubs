import {
  autoWidth as autoWidthStyle,
  header as headerStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  resultPanel as resultPanelStyle,
  title as titleStyle,
} from "./Styles.scss";

import AnalysisTableRow from "./AnalysisTableRow";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import classnames from "classnames";
import { compose } from "redux";
import qs from "#functions/qs";
import { useEffect } from "react";
import withAnalysesByAnyId from "#hocs/withAnalysesByAnyId";
import withAnalysis from "#hocs/withAnalysis";

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
  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle, resultPanelStyle);
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
      <Table size={"small"} className={autoWidthStyle}>
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
  } else {
    return null;
  }
  return (
    <div className={css}>
      <div className={headerStyle}>
        <span className={titleStyle}>Analyses</span>
      </div>
      <div>{analysisTable}</div>
    </div>
  );
};

export default compose(withAnalysesByAnyId, withAnalysis)(AnalysisPanel);
