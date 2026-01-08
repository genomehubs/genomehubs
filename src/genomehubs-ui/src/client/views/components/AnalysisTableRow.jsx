import React, { Fragment, memo, useEffect, useState } from "react";

import FileTable from "./FileTable";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import NavLink from "./NavLink";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Tooltip from "./Tooltip";
import { compose } from "redux";
import dispatchSetRecord from "../hocs/dispatchSetRecord";
import makeStyles from "@mui/styles/makeStyles";
import { useNavigate } from "@reach/router";
import withAnalysesByAnyId from "../hocs/withAnalysesByAnyId";
import withAnalysis from "../hocs/withAnalysis";
import withRecord from "../hocs/withRecord";
import withTaxonomy from "../hocs/withTaxonomy";

const useRowStyles = makeStyles({
  root: {
    "& > *": {
      borderBottom: "unset",
    },
  },
  listSpan: {
    cursor: "pointer",
    "&:not(:last-child):after": {
      content: '", "',
    },
  },
});
const AnalysisTableRow = ({
  analysisId,
  meta,
  setRecord,
  record,
  taxonomy,
  currentResult,
}) => {
  if (!meta) {
    return null;
  }
  const navigate = useNavigate();
  const classes = useRowStyles();
  const [fileOpen, setFileOpen] = useState(false);
  const [asmOpen, setAsmOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(false);

  // useEffect(() => {
  //   if (analysisId) {
  //     if (!meta) {
  //       let query = `analysis_id==${analysisId}`;
  //       let result = "analysis";
  //     }
  //   }
  // }, [analysisId]);

  const expandIcon = ({ condition = true, open, setOpen }) => {
    if (condition) {
      return (
        <span>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </span>
      );
    }
    return null;
  };

  let fileExpand = expandIcon({
    condition: meta.file_count,
    open: fileOpen,
    setOpen: setFileOpen,
  });

  let title = meta.title || analysisId;
  title = <TableCell key={title}>{title}</TableCell>;
  if (meta.description) {
    title = (
      <Tooltip key={"tooltip"} title={meta.description} arrow placement={"top"}>
        {title}
      </Tooltip>
    );
  }

  let analysisCells = [];
  analysisCells.push(title);
  analysisCells.push(
    <TableCell key={"expand"}>
      {meta.file_count} files {fileExpand}
    </TableCell>
  );

  const listContent = ({ list, handleClick, open, setOpen, result }) => {
    const icon = expandIcon({
      open,
      setOpen,
    });
    const plural = { assembly: "assemblies", taxon: "taxa" };
    const currentId = record.record[`${currentResult}_id`];

    const entrySpan = (entryId) => (
      <span
        className={classes.listSpan}
        key={entryId}
        onClick={() =>
          handleClick({ id: entryId, currentId, result, taxonomy, navigate })
        }
      >
        {entryId}
      </span>
    );
    if (list) {
      if (open) {
        return (
          <Grid container direction="column" key={"grid"}>
            <Grid>
              {list.length} {plural[result]} {icon}
            </Grid>
            <Grid>{list.map((entryId) => entrySpan(entryId))}</Grid>
          </Grid>
        );
      } else if (Array.isArray(list)) {
        if (list.length > 1) {
          return (
            <Fragment key={"fragment"}>
              {list.length} {plural[result]} {icon}
            </Fragment>
          );
        } else {
          return (
            <Fragment key={"fragment"}>
              {list.map((entryId) => entrySpan(entryId))}
            </Fragment>
          );
        }
      } else {
        return entrySpan(list);
      }
    }
  };

  let asmContent = listContent({
    list: meta.assembly_id,
    open: asmOpen,
    setOpen: setAsmOpen,
    handleClick: setRecord,
    result: "assembly",
  });
  analysisCells.push(<TableCell key={"assemblies"}>{asmContent}</TableCell>);

  let taxContent = listContent({
    list: meta.taxon_id,
    open: taxOpen,
    setOpen: setTaxOpen,
    handleClick: setRecord,
    result: "taxon",
  });
  analysisCells.push(<TableCell key={"taxa"}>{taxContent}</TableCell>);
  if (meta.source_url) {
    analysisCells.push(
      <TableCell key={"source"}>
        {<NavLink href={meta.source_url}>{meta.source || meta.name}</NavLink>}
      </TableCell>
    );
  }
  return (
    <Fragment key={analysisId}>
      <TableRow className={classes.root}>{analysisCells}</TableRow>
      {fileOpen && (
        <TableRow>
          <TableCell></TableCell>
          <TableCell colSpan={4}>
            <FileTable analysisId={analysisId} analysisMeta={meta} />
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
};

export default compose(
  memo,
  withTaxonomy,
  dispatchSetRecord,
  withAnalysis,
  withAnalysesByAnyId,
  withRecord
)(AnalysisTableRow);
