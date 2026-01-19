import {
  flexCenterHorizontal as flexCenterHorizontalStyle,
  flexCenter as flexCenterStyle,
  fullWidth as fullWidthStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  resultPanel as resultPanelStyle,
} from "./Styles.scss";

import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import classnames from "classnames";
import { compose } from "redux";
import withSearch from "#hocs/withSearch";
import withTypes from "#hocs/withTypes";

const SearchSummary = ({ searchTerm, searchResults }) => {
  if (!searchResults.status || !searchResults.status.hasOwnProperty("hits")) {
    return null;
  }
  const count = searchResults.status.hits;
  const { uniqueCount, isMsearch, queryGroups } = searchResults;

  let css = classnames(
    infoPanelStyle,
    infoPanel1ColumnStyle,
    resultPanelStyle,
    flexCenterStyle,
    flexCenterHorizontalStyle,
    fullWidthStyle,
  );

  return (
    <div className={css}>
      {searchResults.isFetching ? (
        <Grid style={{ minWidth: "150px" }}>
          <Skeleton variant="text" />
        </Grid>
      ) : isMsearch && queryGroups && queryGroups.length > 0 ? (
        <Grid container spacing={2} style={{ width: "100%" }}>
          {/* Overall summary */}
          <Grid item xs={12} style={{ marginBottom: "16px" }}>
            <strong>
              {count} result{count !== 1 ? "s" : ""} displayed
              {uniqueCount !== undefined ? ` (${uniqueCount} unique)` : ""}
            </strong>
          </Grid>

          {/* Batch query breakdown */}
          <Grid item xs={12}>
            <TableContainer component={Paper} style={{ maxHeight: "400px" }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow style={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell style={{ fontWeight: "bold" }}>Query</TableCell>
                    <TableCell align="right" style={{ fontWeight: "bold" }}>
                      Total
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: "bold" }}>
                      Shown
                    </TableCell>
                    <TableCell style={{ fontWeight: "bold" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queryGroups.map((group, idx) => (
                    <TableRow
                      key={idx}
                      style={{
                        backgroundColor:
                          group.error || group.noResults
                            ? "#fff3e0"
                            : "inherit",
                      }}
                    >
                      <TableCell
                        style={{
                          maxWidth: "400px",
                          wordBreak: "break-word",
                          fontFamily: "monospace",
                          fontSize: "12px",
                        }}
                      >
                        {group.query}
                      </TableCell>
                      <TableCell align="right" style={{ fontWeight: "bold" }}>
                        {group.totalCount}
                      </TableCell>
                      <TableCell align="right">
                        {group.count}
                        {group.hasMore
                          ? `+ (${group.totalCount - group.count})`
                          : ""}
                      </TableCell>
                      <TableCell>
                        {group.error ? (
                          <span style={{ color: "red" }}>
                            Error: {group.error}
                          </span>
                        ) : group.noResults ? (
                          <span style={{ color: "orange" }}>No results</span>
                        ) : (
                          <span style={{ color: "green" }}>✓</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Summary row */}
                  <TableRow
                    style={{ backgroundColor: "#e3f2fd", fontWeight: "bold" }}
                  >
                    <TableCell style={{ fontWeight: "bold" }}>TOTAL</TableCell>
                    <TableCell align="right" style={{ fontWeight: "bold" }}>
                      {queryGroups.reduce((sum, g) => sum + g.totalCount, 0)}
                    </TableCell>
                    <TableCell align="right" style={{ fontWeight: "bold" }}>
                      {count}
                    </TableCell>
                    <TableCell>
                      {uniqueCount !== undefined && (
                        <span style={{ fontWeight: "bold", color: "blue" }}>
                          {uniqueCount} unique
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      ) : (
        <Grid>
          {count} result{count >= 1 ? (count == 1 ? ":" : "s:") : "s"}
          {uniqueCount !== undefined ? ` (${uniqueCount} unique)` : ""}
        </Grid>
      )}
    </div>
  );
};

export default compose(withTypes, withSearch)(SearchSummary);
