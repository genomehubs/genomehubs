import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DescriptionIcon from "@mui/icons-material/Description";
import Grid from "@mui/material/Grid";
import HeightIcon from "@mui/icons-material/Height";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "./Tooltip";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import VerticalAlignTopIcon from "@mui/icons-material/VerticalAlignTop";
import makeStyles from "@mui/styles/makeStyles";
import { useState } from "react";
import withStyles from "@mui/styles/withStyles";

export const useStyles = makeStyles(() => ({
  upIcon: {
    fontSize: "1em",
    transform: "rotate(270deg)",
    fontWeight: 700,
  },
  downIcon: {
    fontSize: "1em",
    transform: "rotate(90deg)",
    fontWeight: 700,
  },
  iconButton: {
    fontSize: "1em",
    fontWeight: 700,
  },
  constraint: {
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

const ValueCell = ({ value_metadata, classes }) => {
  let [expanded, setExpanded] = useState(false);
  let expandable;
  let descriptions = [];
  if (value_metadata) {
    for (let [value, obj] of Object.entries(value_metadata)) {
      if (value == "default") {
        continue;
      }
      let { description } = obj;
      if (description) {
        descriptions.push(
          <TableRow
            key={value}
            sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
          >
            <TableCell>{value}</TableCell>
            <TableCell>{description}</TableCell>
          </TableRow>,
        );
      }
    }
  }
  if (descriptions.length == 0) {
    return <TableCell />;
  }
  return (
    <TableCell>
      <Tooltip
        title={
          expanded
            ? "click to hide value descriptions"
            : `click to show ${descriptions.length} value descriptions`
        }
        arrow
        placement={"top"}
      >
        <span
          className={
            expandable ? classes.expandableConstraint : classes.constraint
          }
          onClick={() => setExpanded(!expanded)}
        >
          <div>{descriptions.length} value descriptions</div>
          {expanded && <Table size="small">{descriptions}</Table>}
        </span>
      </Tooltip>
    </TableCell>
  );
};

const GroupRows = ({ group, entries, classes, result }) => {
  let rows = [];
  for (let entry of entries) {
    let { key, display_name, description, long_description } = entry;
    let { display_level, type, processed_type, constraint, value_metadata } =
      entry;
    let summaryCell;
    if (result == "taxon") {
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
      summaryCell = <TableCell>{summaryArray}</TableCell>;
    }

    let title;
    let desc_title;
    if (display_name) {
      title = display_name;
    }
    if (long_description) {
      if (description) {
        desc_title = long_description;
        description = (
          <span>
            {description}
            <span
              style={{ position: "relative", top: "-0.4em", left: "0.1em" }}
            >
              <DescriptionIcon sx={{ fontSize: 12 }} />
            </span>
          </span>
        );
      } else {
        description = long_description;
      }
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
            <span style={{ position: "relative", top: "-0.4em", left: "0em" }}>
              <AutoAwesomeIcon sx={{ fontSize: 12 }} />
            </span>
          </Tooltip>
        </>
      );
    }
    if (desc_title) {
      description = (
        <Tooltip
          key={name}
          title={
            <div style={{ whiteSpace: "pre-line", maxWidth: "14em" }}>
              {desc_title}
            </div>
          }
          arrow
          placement={"top"}
          followCursor
          enterDelay={500}
        >
          {description}
        </Tooltip>
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
        <TableCell>{description}</TableCell>
        <TypeCell
          display_type={display_type}
          constraint={constraint}
          classes={classes}
        />
        {summaryCell}
        <ValueCell value_metadata={value_metadata} classes={classes} />
      </TableRow>,
    );
  }
  return rows;
};

const ReportTypes = ({ minDim, types }) => {
  let result;
  try {
    result = Object.values(types)[0][0].group;
  } catch (e) {
    result = "taxon";
  }
  const classes = useStyles();
  let rows = [];
  for (let [group, entries] of Object.entries(types)) {
    rows = rows.concat(
      <GroupRows
        key={group}
        group={group}
        entries={entries}
        classes={classes}
        result={result}
      />,
    );
  }
  return (
    <Grid style={{ maxHeight: minDim, overflowY: "auto" }} size="grow">
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <StyledTableCell>Display group</StyledTableCell>
            <StyledTableCell>Attribute name</StyledTableCell>
            <StyledTableCell>Attribute description</StyledTableCell>
            <StyledTableCell>Attribute type</StyledTableCell>
            {result == "taxon" && (
              <StyledTableCell>Summary function</StyledTableCell>
            )}
            <StyledTableCell>Described values</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>{rows}</TableBody>
      </Table>
    </Grid>
  );
};

export default ReportTypes;
