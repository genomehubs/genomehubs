import AttributeTableRow from "./AttributeTableRow";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { autoWidth as autoWidthStyle } from "./Styles.scss";

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
      <Table size={"small"} className={autoWidthStyle}>
        <TableHead>
          <TableRow>
            <TableCell>Attribute</TableCell>
            <TableCell>Value</TableCell>
            <TableCell></TableCell>
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
