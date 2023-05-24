import React, { useRef } from "react";

import Grid from "@material-ui/core/Grid";
import HeightIcon from "@material-ui/icons/Height";
import IconButton from "@material-ui/core/IconButton";
import LaunchIcon from "@material-ui/icons/Launch";
import NavLink from "./NavLink";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Tooltip from "@material-ui/core/Tooltip";
import TrendingFlatIcon from "@material-ui/icons/TrendingFlat";
import VerticalAlignTopIcon from "@material-ui/icons/VerticalAlignTop";
import { compose } from "recompose";
import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles(() => ({
  upIcon: {
    fontSize: "0.6em",
    transform: "rotate(270deg)",
  },
  downIcon: {
    fontSize: "0.6em",
    transform: "rotate(90deg)",
  },
  iconButton: {
    fontSize: "0.6em",
  },
}));

const TypesGroup = ({ group, entries, classes }) => {
  let rows = [];
  for (let entry of entries) {
    let { key, display_name, description } = entry;
    let { display_level, processed_type, constraint } = entry;
    let { summary, traverse, traverse_direction, traverse_limit } = entry;
    let constraintType;
    if (constraint) {
      if ("enum" in constraint) {
        constraintType = "enum";
      } else if ("len" in constraint) {
        constraintType = "length";
      } else if ("min" in constraint) {
        if ("max" in constraint) {
          constraintType = "range";
        } else {
          constraintType = "min";
        }
      } else if ("max" in constraint) {
        constraintType = "max";
      } else {
        console.log("unknown constraint");
        console.log(constraint);
      }
    }
    summary = Array.isArray(summary) ? summary.join(", ") : summary;
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
          traverseIcon = <HeightIcon className={classes.iconButton} />;
      }
      traverse = (
        <IconButton style={{ pointerEvents: "none" }}>
          {traverseIcon}
          <span className={classes.iconButton}>{traverse}</span>
        </IconButton>
      );
    } else {
      traverse = undefined;
    }
    rows.push(
      <TableRow key={key}>
        <TableCell>{key}</TableCell>
        <TableCell>{processed_type}</TableCell>
        <TableCell>{constraintType}</TableCell>
        <TableCell>{summary}</TableCell>
        <TableCell>{traverse}</TableCell>
      </TableRow>
    );
  }
  return (
    <Grid item>
      {group}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Constraint</TableCell>
            <TableCell>Summary</TableCell>
            <TableCell>Traverse</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </Grid>
  );
};

const ReportTypes = ({ minDim, types }) => {
  const classes = useStyles();
  let groups = [];
  for (let [group, entries] of Object.entries(types)) {
    groups.push(
      <TypesGroup
        key={group}
        group={group}
        entries={entries}
        classes={classes}
      />
    );
  }
  return (
    <Grid item xs style={{ maxHeight: minDim, overflowY: "auto" }}>
      <Grid container direction="column">
        {groups}
      </Grid>
    </Grid>
  );
};

export default ReportTypes;
