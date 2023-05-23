import React, { useRef } from "react";

import Grid from "@material-ui/core/Grid";
import LaunchIcon from "@material-ui/icons/Launch";
import NavLink from "./NavLink";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Tooltip from "@material-ui/core/Tooltip";
import { compose } from "recompose";

const TypesGroup = ({ group, entries }) => {
  console.log({ group, entries });
  let rows = [];
  for (let entry of entries) {
    let { key, display_name, description } = entry;
    let { display_level, processed_type, constraint } = entry;
    let { summary, traverse, traverse_direction, traverse_limit } = entry;
    summary = Array.isArray(summary) ? summary.join(", ") : summary;
    rows.push(
      <TableRow key={key}>
        <TableCell>{key}</TableCell>
        <TableCell>{processed_type}</TableCell>
        <TableCell>Constraint</TableCell>
        <TableCell>{summary}</TableCell>
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
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </Grid>
  );
};

const ReportTypes = ({ minDim, types }) => {
  let groups = [];
  for (let [group, entries] of Object.entries(types)) {
    groups.push(<TypesGroup key={group} group={group} entries={entries} />);
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
