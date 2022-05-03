import React, { useEffect } from "react";

import AttributeTableRow from "./AttributeTableRow";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import classnames from "classnames";
import { compose } from "recompose";
import { format } from "d3-format";
import { options } from "preact";
import qs from "qs";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import withAnalysesByAnyId from "../hocs/withAnalysesByAnyId";
import withAnalysis from "../hocs/withAnalysis";

const AttributePanel = ({ attributes, result, taxonId }) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );

  let attributeTable;
  if (attributes) {
    let tableRows = Object.keys(attributes).map((attributeId) => {
      return (
        <AttributeTableRow
          attributeId={attributeId}
          taxonId={taxonId}
          key={attributeId}
          currentResult={result}
          meta={attributes[attributeId]}
        />
      );
    });
    attributeTable = (
      <Table size={"small"} className={styles.autoWidth}>
        <TableHead>
          <TableRow>
            <TableCell>Attribute</TableCell>
            <TableCell>Value</TableCell>
            {result == "taxon" && (
              <>
                <TableCell>Count</TableCell>
                <TableCell>Summary</TableCell>
              </>
            )}
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
        <span className={styles.title}>Attributes</span>
      </div>
      <div>{attributeTable}</div>
    </div>
  );
};

export default AttributePanel;
