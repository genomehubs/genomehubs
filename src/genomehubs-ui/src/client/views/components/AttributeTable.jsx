import AttributeTableRow from "./AttributeTableRow";
import React from "react";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import styles from "./Styles.scss";

const AttributeTable = ({ attributes, result, taxonId }) => {
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
    return (
      <Table size={"small"} className={styles.autoWidth}>
        <TableHead>
          <TableRow>
            <TableCell>Attribute</TableCell>
            <TableCell>Value</TableCell>
            {result == "taxon" && (
              <>
                {/* <TableCell>Count</TableCell> */}
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
  return null;
};

export default AttributeTable;
