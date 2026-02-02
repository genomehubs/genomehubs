import {
  aggregationToggleOpaque as aggregationToggleOpaqueStyle,
  aggregationToggle as aggregationToggleStyle,
  first as firstStyle,
  last as lastStyle,
} from "../Styles.scss";

import Badge from "@mui/material/Badge";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import Checkbox from "@mui/material/Checkbox";
import MuiTableCell from "@mui/material/TableCell";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import SettingsIcon from "@mui/icons-material/Settings";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Tooltip from "../Tooltip";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import ViewWeekOutlinedIcon from "@mui/icons-material/ViewWeekOutlined";
import classnames from "classnames";
import makeStyles from "@mui/styles/makeStyles";
import { styled } from "@mui/material/styles";
import withStyles from "@mui/styles/withStyles";

const borderColor = "#dddddd";
export const darkColor = 44;
export const lightColor = 22;

export const StyledTableRow = withStyles((theme) => ({
  root: {
    width: "100%",
  },
}))(TableRow);

export const StyledBadge = styled(Badge)(() => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#333",
    color: "#fff",
    top: 0,
    right: 0,
    borderRadius: "10px",
    border: "2px solid white",
    transform: "translate(98%, -50%)",
  },
}));

export const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: "calc( 100% - 0.5em )",
    marginBottom: "1em",
    marginLeft: "0.5em",
    minWidth: "750px",
  },
  table: {
    maxWidth: "100%",
    minWidth: "750px",
  },
  ["PrivateSwitchBase-root-4"]: {
    padding: "3px",
  },
  visuallyHidden: {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: "1px",
    margin: -1,
    overflow: "hidden",
    padding: "0px",
    position: "absolute",
    top: 20,
    width: "1px",
  },
}));

export const TableCell = styled(MuiTableCell)({
  padding: "1px 6px",
  lineHeight: "inherit",
});

export const StickyCell = withStyles((theme) => ({
  root: {
    position: "sticky",
    left: 0,
    zIndex: 100,
  },
}))(TableCell);

export const OddTableCell = withStyles((theme) => ({
  root: {
    textAlign: "center",
    backgroundColor: `#ffffff00`,
  },
}))(TableCell);

export const EvenTableCell = withStyles((theme) => ({
  root: {
    backgroundColor: `${borderColor}33`,
  },
}))(OddTableCell);

export const SpanTableCell = withStyles((theme) => ({
  root: {
    textAlign: "left",
  },
}))(EvenTableCell);

export const StyledCheckbox = ({ color, fontSize = "small", ...props }) => {
  return (
    <Checkbox
      style={{
        padding: "1px",
        color: props.color,
      }}
      icon={<CheckBoxOutlineBlankIcon style={{ fontSize, fill: color }} />}
      checkedIcon={<CheckBoxIcon style={{ fontSize, fill: color }} />}
      {...props}
    />
  );
};

export const StyledColbox = ({ color, ...props }) => {
  return (
    <Checkbox
      style={{
        padding: "1px",
        color,
      }}
      icon={<SettingsApplicationsIcon style={{ fontSize: "small" }} />}
      checkedIcon={<SettingsIcon style={{ fontSize: "small" }} />}
      {...props}
    />
  );
};

export const StyledColSplit = ({ color, ...props }) => {
  return (
    <Checkbox
      style={{
        padding: "1px",
        color,
      }}
      icon={<ViewWeekOutlinedIcon style={{ fontSize: "small" }} />}
      checkedIcon={<ViewWeekIcon style={{ fontSize: "small" }} />}
      {...props}
    />
  );
};

export const SortableCell = ({
  name,
  field = name,
  summary = "",
  description,
  status,
  colCount = 0,
  colSpan = 0,
  color,
  classes,
  searchIndex,
  CustomCell,
  borderBottom,
  statusColors = {},
  sortBy,
  sortOrder,
  sortDirection,
  handleTableSort = () => {},
  setAttributeSettings,
  showExcludeBoxes,
  excludeDirect,
  excludeAncestral,
  excludeDescendant,
  excludeMissing,
  handleToggleExclusion = () => {},
  handleToggleColSpan = () => {},
}) => {
  if (!CustomCell) {
    CustomCell = TableCell;
  }
  let css = aggregationToggleStyle;
  let prefix = name.replace(/:.+$/, "");
  if (
    excludeAncestral &&
    (excludeDirect.hasOwnProperty(prefix) ||
      excludeDescendant.hasOwnProperty(prefix) ||
      excludeAncestral.hasOwnProperty(prefix) ||
      excludeMissing.hasOwnProperty(prefix))
  ) {
    css = classnames(aggregationToggleStyle, aggregationToggleOpaqueStyle);
  }

  let title = handleTableSort ? `Sort by ${field}` : field;
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
        {status && status != "stable" && (
          <div
            style={{
              width: "100%",
              marginTop: "0.5em",
              textAlign: "right",
            }}
          >
            status: {status}
          </div>
        )}
      </div>
    );
  }

  let SpanCell = colSpan > 0 ? SpanTableCell : CustomCell;

  let cellCss = "";
  if (colSpan > 0) {
    cellCss = classnames(firstStyle, lastStyle);
  }

  if (Array.isArray(summary)) {
    summary = summary[0];
  }

  let cellTitle =
    summary && summary.startsWith("metadata.")
      ? `${name}${summary.replace("metadata", "")}`
      : name;
  return (
    <SpanCell
      key={`${name}_${summary}`}
      colSpan={colSpan}
      className={cellCss}
      style={{
        whiteSpace: "normal",
        wordWrap: "break-word",
        maxWidth: "8rem",
        minWidth: "3rem",
        lineHeight: "1rem",
        verticalAlign: "bottom",
        borderBottom,
        backgroundColor: color,
      }}
      sortDirection={sortDirection}
    >
      <Tooltip key={field} title={title} arrow>
        {(handleTableSort && (
          <TableSortLabel
            active={sortBy === field}
            direction={sortOrder}
            onClick={() =>
              handleTableSort(
                sortDirection && sortOrder === "desc"
                  ? { sortBy: "none" }
                  : {
                      sortBy: field,
                      sortOrder:
                        sortDirection && sortOrder === "asc" ? "desc" : "asc",
                    },
              )
            }
          >
            {/* {name} */}
            {cellTitle.split("_").join(`_\u200b`).split(".").join(`.\u200b`)}
            {status && status != "stable" && <sup>{`\u2020`}</sup>}
            {sortBy === field ? (
              <span className={classes.visuallyHidden}>
                {sortOrder === "desc"
                  ? "sorted descending"
                  : "sorted ascending"}
              </span>
            ) : null}
          </TableSortLabel>
        )) || (
          <span>
            {name.split("_").join(`_\u200b`)}
            {status && status != "stable" && <sup>{`\u2020`}</sup>}
          </span>
        )}
      </Tooltip>
      <br />
      {(showExcludeBoxes && (
        <span className={css}>
          {showExcludeBoxes == "all" && (
            <Tooltip
              key={"direct"}
              title={"Toggle directly measured values"}
              arrow
            >
              <span>
                <StyledCheckbox
                  checked={!excludeDirect.hasOwnProperty(prefix)}
                  onChange={() =>
                    handleToggleExclusion({ toggleDirect: prefix })
                  }
                  color={statusColors.direct || "green"}
                  inputProps={{ "aria-label": "direct checkbox" }}
                />
              </span>
            </Tooltip>
          )}
          {showExcludeBoxes == "all" && (
            <Tooltip
              key={"descendant"}
              title={"Toggle values inferred from descendant taxa"}
              arrow
            >
              <span>
                <StyledCheckbox
                  checked={!excludeDescendant.hasOwnProperty(prefix)}
                  onChange={() =>
                    handleToggleExclusion({ toggleDescendant: prefix })
                  }
                  color={statusColors.descendant || "orange"}
                  inputProps={{ "aria-label": "descendant checkbox" }}
                />
              </span>
            </Tooltip>
          )}
          {showExcludeBoxes == "all" && (
            <Tooltip
              key={"ancestral"}
              title={"Toggle values inferred from ancestral taxa"}
              arrow
            >
              <span>
                <StyledCheckbox
                  checked={!excludeAncestral.hasOwnProperty(prefix)}
                  onChange={() =>
                    handleToggleExclusion({ toggleAncestral: prefix })
                  }
                  color={statusColors.ancestral || "red"}
                  inputProps={{ "aria-label": "ancestral checkbox" }}
                />
              </span>
            </Tooltip>
          )}
          <Tooltip key={"missing"} title={"Toggle missing values"} arrow>
            <span>
              <StyledCheckbox
                checked={!excludeMissing.hasOwnProperty(prefix)}
                onChange={() =>
                  handleToggleExclusion({ toggleMissing: prefix })
                }
                color={"black"}
                inputProps={{ "aria-label": "missing checkbox" }}
              />
            </span>
          </Tooltip>
          {(searchIndex == "taxon" || searchIndex == "assembly") && (
            <Tooltip key={"columns"} title={"Show/hide subset columns"} arrow>
              <span>
                <StyledColbox
                  // checked={!excludeAncestral.hasOwnProperty(prefix)}
                  // onChange={() =>
                  //   handleToggleExclusion({ toggleAncestral: prefix })
                  // }
                  onClick={() => {
                    setAttributeSettings({
                      attributeId: prefix,
                      adjustColumns: true,
                      currentRecordId: "none",
                      showAttribute: true,
                    });
                  }}
                  color={"black"}
                  inputProps={{ "aria-label": "show/hide columns" }}
                />
              </span>
            </Tooltip>
          )}
          {colCount > 0 && (
            <Tooltip key={"split"} title={"Toggle split column"} arrow>
              <span>
                <span>
                  <StyledColSplit
                    checked={colSpan > 0}
                    // onChange={() =>
                    //   handleToggleExclusion({ toggleAncestral: prefix })
                    // }
                    onClick={() => {
                      handleToggleColSpan(field, colSpan);
                    }}
                    color={"black"}
                    inputProps={{ "aria-label": "split/collapse column" }}
                  />
                </span>
              </span>
            </Tooltip>
          )}
        </span>
      )) || <span className={css}></span>}
    </SpanCell>
  );
};
