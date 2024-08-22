import React, { memo, useEffect } from "react";

import FileModal from "./FileModal";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import LaunchIcon from "@mui/icons-material/Launch";
import NavLink from "./NavLink";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Tooltip from "./Tooltip";
import Typography from "@mui/material/Typography";
import classnames from "classnames";
import { compose } from "recompose";
import formatter from "../functions/formatter";
import makeStyles from '@mui/styles/makeStyles';
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import withAnalysesByAnyId from "../hocs/withAnalysesByAnyId";
import withAnalysis from "../hocs/withAnalysis";
import withApi from "../hocs/withApi";
import withFiles from "../hocs/withFiles";
import withFilesByAnalysisId from "../hocs/withFilesByAnalysisId";
import withRecord from "../hocs/withRecord";
import withSummary from "../hocs/withSummary";
import withTypes from "../hocs/withTypes";

const useStyles = makeStyles((theme) => ({
  pale: {
    opacity: 0.6,
  },
  tableRow: {
    verticalAlign: "top",
  },
}));

const FileTable = ({
  analysisId,
  analysisMeta,
  apiUrl,
  files,
  filesByAnalysisId,
  fetchFiles,
}) => {
  useEffect(() => {
    if (analysisId) {
      if (!files.isFetching && !filesByAnalysisId) {
        let query = `analysis_id==${analysisId}`;
        let result = "file";
        fetchFiles({ query, result });
      }
    }
  }, [analysisId, filesByAnalysisId]);
  const classes = useStyles();
  if (!analysisId) {
    return null;
  }

  let tableRows;
  if (filesByAnalysisId) {
    tableRows = filesByAnalysisId.map((meta) => {
      let externalLink;
      if (meta.source_url) {
        externalLink = (
          <NavLink href={meta.source_url}>
            {meta.source || analysisMeta.source || analysisMeta.name}
          </NavLink>
        );
      } else if (analysisMeta.source_url) {
        externalLink = (
          <NavLink href={analysisMeta.source_url}>
            {analysisMeta.source || analysisMeta.name}
          </NavLink>
        );
      }
      let previewLink = `${apiUrl}/download?recordId=${meta.file_id}&preview=true&streamFile=true`;
      let downloadLink = `${apiUrl}/download?recordId=${meta.file_id}&filename=${meta.name}`;
      return (
        <TableRow key={meta.title} className={classes.tableRow}>
          <TableCell>{meta.title}</TableCell>
          <TableCell>
            <FileModal meta={meta} link={externalLink}>
              <img style={{ cursor: "pointer" }} src={previewLink} />
            </FileModal>
          </TableCell>
          <TableCell>
            <a href={downloadLink}>
              {meta.name} (
              <span style={{ textDecoration: "underline" }}>{`${formatter(
                meta.size_bytes
              )}B`}</span>
              )
            </a>
          </TableCell>
          <TableCell>
            <Grid container direction="column">
              <Grid item xs>
                <span className={classes.pale}>dimensions: </span>
                {meta.size_pixels}
              </Grid>
              <Grid item xs>
                <span className={classes.pale}>description: </span>
                {meta.description}
              </Grid>
              {externalLink && (
                <Grid item xs>
                  <span className={classes.pale}>source: </span>
                  {externalLink}
                </Grid>
              )}
            </Grid>
          </TableCell>
        </TableRow>
      );
    });
  }
  let tableHead = (
    <TableHead>
      <TableRow>
        <TableCell>Title</TableCell>
        <TableCell>Preview</TableCell>
        <TableCell>Download</TableCell>
        <TableCell>Info</TableCell>
      </TableRow>
    </TableHead>
  );
  return (
    <Table size={"small"} className={styles.autoWidth}>
      {tableHead}
      <TableBody>{tableRows}</TableBody>
    </Table>
  );
};

export default compose(
  memo,
  withApi,
  withFiles,
  withFilesByAnalysisId
)(FileTable);
