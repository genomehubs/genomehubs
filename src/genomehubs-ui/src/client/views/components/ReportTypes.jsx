import React, { useState } from "react";
import makeStyles from '@mui/styles/makeStyles';
import withStyles from '@mui/styles/withStyles';

import Grid from "@mui/material/Grid";
import HeightIcon from "@mui/icons-material/Height";
import IconButton from "@mui/material/IconButton";
import LaunchIcon from "@mui/icons-material/Launch";
import NavLink from "./NavLink";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "./Tooltip";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import VerticalAlignTopIcon from "@mui/icons-material/VerticalAlignTop";
import { compose } from "recompose";

export const useStyles = makeStyles(() => ({
  upIcon: {
    fontSize: "1em",
    transform: "rotate(270deg)",
    // color: "#666666",
    fontWeight: 700,
  },
  downIcon: {
    fontSize: "1em",
    transform: "rotate(90deg)",
    // color: "#666666",
    fontWeight: 700,
  },
  iconButton: {
    fontSize: "1em",
    // color: "#666666",
    fontWeight: 700,
  },
  constraint: {
    // color: "#666666",
    fontWeight: 700,
  },
  expandableConstraint: {
    cursor: "pointer",
    fontWeight: 700,
  },
}));

const StyledTableCell = withStyles((theme) => ({
  head: {
    backgroundColor: "#d2e4f0",
    fontWeight: 700,
  },
}))(TableCell);

const truncateList = ({ values, charLimit }) => {
  let entries = [];
  for (let entry of values) {
    if (charLimit == -1) {
      entries.push(entry);
    } else if (charLimit - entry.length > 0) {
      entries.push(entry);
      charLimit -= entry.length;
    } else {
      break;
    }
  }
  let value = entries.join(", ");
  if (values.length > 1) {
    length = values.length;
    if (values.length > entries.length) {
      value += ", ...";
    }
  }
  return value;
};

const TypeCell = ({ display_type, constraint, classes }) => {
  let [expanded, setExpanded] = useState(false);
  let constraintType;
  let constraintValue;
  let constraintSuffix = "";
  let expandable;
  if (constraint) {
    if ("enum" in constraint) {
      constraintType = "enum";
      constraintType = `${constraint.enum.length} value enum`;
      if (expanded) {
        constraintValue = truncateList({
          values: constraint.enum,
          charLimit: -1,
        });
        constraintSuffix = " (click to show less)";
      } else {
        constraintValue = truncateList({
          values: constraint.enum,
          charLimit: 28,
        });
        if (constraintValue.endsWith(", ...")) {
          constraintSuffix = " (click to expand)";
          expandable = true;
        }
      }
    } else if ("len" in constraint) {
      constraintType = "keyword length";
      constraintValue = `${constraint.len} characters`;
    } else if ("min" in constraint) {
      if ("max" in constraint) {
        constraintType = "value range";
        constraintValue = `${constraint.min} to ${constraint.max}`;
      } else {
        constraintType = "minimum value";
        constraintValue = `>= ${constraint.min}`;
      }
    } else if ("max" in constraint) {
      constraintType = "maximum value";
      constraintValue = `<= ${constraint.max}`;
    } else {
      console.log("unknown constraint");
      console.log(constraint);
    }
  }
  return (
    <TableCell>
      {display_type}
      {constraint && (
        <Tooltip
          title={`${constraintType} constraint${constraintSuffix}`}
          arrow
          placement={"top"}
        >
          <span
            className={
              expandable ? classes.expandableConstraint : classes.constraint
            }
            onClick={() => setExpanded(!expanded)}
          >
            {" "}
            ({constraintValue})
          </span>
        </Tooltip>
      )}
    </TableCell>
  );
};

const GroupRows = ({ group, entries, classes }) => {
  let rows = [];
  for (let entry of entries) {
    let { key, display_name, description } = entry;
    let { display_level, type, processed_type, constraint } = entry;
    let { summary, traverse, traverse_direction, traverse_limit } = entry;

    let summaryArray = Array.isArray(summary) ? summary : [summary];
    summary = Array.isArray(summary) ? summary.join(", ") : summary;
    let traverseDirection = traverse_direction;
    if (traverse) {
      let traverseIcon;
      switch (traverse_direction) {
        case "up":
          if (traverse_limit) {
            traverseIcon = (
              <VerticalAlignTopIcon className={classes.iconButton} />
            );
          } else {
            traverseIcon = <TrendingFlatIcon className={classes.upIcon} />;
          }
          break;
        case "down":
          traverseIcon = <TrendingFlatIcon className={classes.downIcon} />;
          break;
        default:
          traverseDirection = "up & down";
          traverseIcon = <HeightIcon className={classes.iconButton} />;
      }
      let traverseIndex = summaryArray.indexOf(traverse);
      traverse = (
        <span style={{ whiteSpace: "nowrap" }}>
          <span className={classes.iconButton}>{traverse}</span>
          {traverseIcon}
        </span>
      );
      summaryArray = summaryArray.map((value, i) => (
        <span key={i}>
          {value}
          {i < summaryArray.length - 1 && ", "}
        </span>
      ));

      if (traverseIndex > -1) {
        summaryArray[traverseIndex] = (
          <Tooltip
            key={traverseIndex}
            title={`values filled ${traverseDirection} the tree`}
            arrow
            placement={"top"}
          >
            <span>
              {traverse}
              {traverseIndex < summaryArray.length - 1 && ", "}
            </span>
          </Tooltip>
        );
      }
    } else {
      summaryArray = summaryArray.map((value, i) => (
        <span key={i}>
          {value}
          {i < summaryArray.length - 1 && ", "}
        </span>
      ));
      traverse = undefined;
    }

    let title;
    if (display_name) {
      title = display_name;
      if (description) {
        title = (
          <div style={{ whiteSpace: "pre-line", maxWidth: "14em" }}>
            <div>{title}</div>
            <div
              style={{
                width: "100%",
                marginTop: "0.5em",
                borderTop: "solid white 1px",
              }}
            >
              {description}
            </div>
          </div>
        );
      }
    } else if (description) {
      title = description;
    }
    let name = key;
    if (title) {
      name = (
        <Tooltip key={name} title={title} arrow placement={"top"}>
          <span>{key}</span>
        </Tooltip>
      );
    }
    if (display_level == 1) {
      name = (
        <>
          {name}{" "}
          <Tooltip
            key={name}
            title={"default result field"}
            arrow
            placement={"top"}
          >
            <span style={{ fontWeight: 700 }}>*</span>
          </Tooltip>
        </>
      );
    }

    let display_type = processed_type;
    // if (display_type == "float") {
    //   if (["short", "long"].includes(type)) {
    //     display_type = `integer`;
    //   } else if (["integer", "byte"].includes(type)) {
    //     display_type = type;
    //   }
    // }

    rows.push(
      <TableRow key={key}>
        <TableCell>{group}</TableCell>
        <TableCell>{name}</TableCell>
        <TypeCell
          display_type={display_type}
          constraint={constraint}
          classes={classes}
        />
        <TableCell>{summaryArray}</TableCell>
      </TableRow>
    );
  }
  return rows;
};

const ReportTypes = ({ minDim, types }) => {
  const classes = useStyles();
  let rows = [];
  for (let [group, entries] of Object.entries(types)) {
    rows = rows.concat(
      <GroupRows
        key={group}
        group={group}
        entries={entries}
        classes={classes}
      />
    );
  }
  return (
    <Grid item xs style={{ maxHeight: minDim, overflowY: "auto" }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <StyledTableCell>Display group</StyledTableCell>
            <StyledTableCell>Attribute name</StyledTableCell>
            <StyledTableCell>Attribute type</StyledTableCell>
            <StyledTableCell>Summary function</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </Grid>
  );
};

export default ReportTypes;
