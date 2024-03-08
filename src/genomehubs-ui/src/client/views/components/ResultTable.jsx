import React, { useEffect, useRef, useState } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import { useLocation, useNavigate } from "@reach/router";

import AdjustIcon from "@material-ui/icons/Adjust";
import AggregationIcon from "./AggregationIcon";
import Badge from "@material-ui/core/Badge";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import Checkbox from "@material-ui/core/Checkbox";
import Citation from "./Citation";
import DescriptionIcon from "@material-ui/icons/Description";
import DownloadButton from "./DownloadButton";
import FilterListIcon from "@material-ui/icons/FilterList";
import Grid from "@material-ui/core/Grid";
import Grow from "@material-ui/core/Grow";
import IconButton from "@material-ui/core/IconButton";
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";
import LaunchIcon from "@material-ui/icons/Launch";
import LinkButton from "./LinkButton";
import MuiTableCell from "@material-ui/core/TableCell";
import RadioButtonCheckedOutlinedIcon from "@material-ui/icons/RadioButtonCheckedOutlined";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import ReportError from "./ReportError";
import ResultFilter from "./ResultFilter";
import ResultModalControl from "./ResultModalControl";
import SearchPagination from "./SearchPagination";
import SettingsApplicationsIcon from "@material-ui/icons/SettingsApplications";
import SettingsIcon from "@material-ui/icons/Settings";
import Skeleton from "@material-ui/lab/Skeleton";
import Tab from "./Tab";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Tooltip from "./Tooltip";
import ViewWeekIcon from "@material-ui/icons/ViewWeek";
import ViewWeekOutlinedIcon from "@material-ui/icons/ViewWeekOutlined";
import VisibilityIcon from "@material-ui/icons/Visibility";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchRecord from "../hocs/dispatchRecord";
import expandFieldList from "../functions/expandFieldList";
import { formatter } from "../functions/formatter";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import withColors from "../hocs/withColors";
import withNames from "../hocs/withNames";
import withRanks from "../hocs/withRanks";
import withSearch from "../hocs/withSearch";
import withSearchDefaults from "../hocs/withSearchDefaults";
import withSiteName from "../hocs/withSiteName";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

const borderColor = "#dddddd";

const StyledTableRow = withStyles((theme) => ({
  root: {
    width: "100%",
  },
}))(TableRow);

const StyledBadge = withStyles((theme) => ({
  badge: {
    right: "50%",
    top: 6,
    fontSize: "0.8em",
    border: `2px solid ${theme.palette.background.paper}`,
    padding: "0 4px",
    color: "white",
    backgroundColor: "rgba(0,0,0,0.26)",
  },
}))(Badge);

export const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: "calc( 100% - 0.5em )",
    marginBottom: "1em",
    marginLeft: "0.5em",
    minWidth: 750,
  },
  table: {
    maxWidth: "100%",
    minWidth: 750,
  },
  ["PrivateSwitchBase-root-4"]: {
    padding: "3px",
  },
  visuallyHidden: {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    top: 20,
    width: 1,
  },
  modal: {
    display: "flex",
    padding: theme.spacing(1),
    alignItems: "center",
    justifyContent: "center",
  },
  paper: {
    width: 400,
    maxWidth: "75vw",
    maxHeight: "75vh",
    backgroundColor: theme.palette.background.paper,
    border: "2px solid #000",
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
    cursor: "default",
    outline: 0,
  },
}));

const TableCell = withStyles((theme) => ({
  root: {
    padding: "1px 6px",
    // borderBottom: `solid ${borderColor} 1px`,
    lineHeight: "inherit",
  },
}))(MuiTableCell);

const StickyCell = withStyles((theme) => ({
  root: {
    position: "sticky",
    left: 0,
    zIndex: 100,
    backgroundColor: "#f8f8f8",
  },
}))(TableCell);

const OddTableCell = withStyles((theme) => ({
  root: {
    textAlign: "center",
    backgroundColor: `#ffffff00`,
  },
}))(TableCell);

const EvenTableCell = withStyles((theme) => ({
  root: {
    backgroundColor: `${borderColor}33`,
  },
}))(OddTableCell);

const SpanTableCell = withStyles((theme) => ({
  root: {
    textAlign: "left",
  },
}))(EvenTableCell);

const StyledCheckbox = ({ color, fontSize = "small", ...props }) => {
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

const StyledColbox = ({ color, ...props }) => {
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

const StyledColSplit = ({ color, ...props }) => {
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

const SortableCell = ({
  name,
  description,
  status,
  colCount,
  colSpan,
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
  let css = styles.aggregationToggle;
  let prefix = name.replace(/:.+$/, "");
  if (
    excludeAncestral &&
    (excludeDirect.hasOwnProperty(prefix) ||
      excludeDescendant.hasOwnProperty(prefix) ||
      excludeAncestral.hasOwnProperty(prefix) ||
      excludeMissing.hasOwnProperty(prefix))
  ) {
    css = classnames(styles.aggregationToggle, styles.aggregationToggleOpaque);
  }

  let title = handleTableSort ? `Sort by ${name}` : name;
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

  let SpanCell = colSpan > 1 ? SpanTableCell : CustomCell;

  let cellCss = "";
  if (colSpan > 1) {
    cellCss = classnames(styles.first, styles.last);
  }

  return (
    <SpanCell
      key={name}
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
      }}
      sortDirection={sortDirection}
    >
      <Tooltip key={name} title={title} arrow>
        {(handleTableSort && (
          <TableSortLabel
            active={sortBy === name}
            direction={sortOrder}
            onClick={() =>
              handleTableSort(
                sortDirection && sortOrder === "desc"
                  ? { sortBy: "none" }
                  : {
                      sortBy: name,
                      sortOrder:
                        sortDirection && sortOrder === "asc" ? "desc" : "asc",
                    }
              )
            }
          >
            {/* {name} */}
            {name.split("_").join(`_\u200b`)}
            {status && status != "stable" && <sup>{`\u2020`}</sup>}
            {sortBy === name ? (
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
          {searchIndex == "taxon" && (
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
          {colCount > 1 && (
            <Tooltip key={"split"} title={"Toggle split column"} arrow>
              <span>
                <span>
                  <StyledColSplit
                    checked={colSpan > 1}
                    // onChange={() =>
                    //   handleToggleExclusion({ toggleAncestral: prefix })
                    // }
                    onClick={() => {
                      handleToggleColSpan(prefix, colSpan);
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

const setCellClassName = (i, length) => {
  if (length == 1) {
    return "";
  }
  let css = i % 2 == 1 ? styles.contrast : "";
  if (i == 0) {
    css = classnames(css, styles.first);
  } else if (i == length - 1) {
    css = classnames(css, styles.last);
  }
  return css;
};

const ResultTable = ({
  types,
  displayTypes,
  fetchSearchResults,
  saveSearchResults,
  searchResults,
  searchDefaults,
  setSearchDefaults,
  searchTerm,
  hideEmpty = true,
  setSearchTerm,
  activeNameClasses,
  activeRanks,
  searchIndex,
  setPreferSearchTerm,
  setAttributeSettings,
  statusColors,
  taxonomy,
  basename,
}) => {
  const rootRef = useRef(null);
  const expandColumns = searchDefaults.expandColumns || {};
  let expandedTypes = [];
  let emptyBuckets = new Set();
  if (searchResults.aggs?.fields) {
    emptyBuckets = new Set(
      Object.entries(searchResults.aggs.fields.by_key.buckets)
        .filter(([_, obj]) => obj.doc_count == 0)
        .map(([key]) => key)
    );
  }
  if (searchTerm) {
    if (searchTerm.fields) {
      let fieldList = expandFieldList({ fields: searchTerm.fields, types });
      expandedTypes = displayTypes.filter(
        ({ name }) => !emptyBuckets.has(name) && name != "none"
      );
      for (let field of fieldList) {
        if (!field.includes(":")) {
          continue;
        }
        let [name, summary] = field.split(":");
        let index = expandedTypes.findIndex(({ name: n }) => n == name);
        let defaultValue = (types[name] || { processed_simple: "value" })
          .processed_simple;
        expandedTypes.splice(index + 1, 0, {
          name: field,
          summary: summary || defaultValue,
        });
      }
      for (let obj of expandedTypes) {
        let [name, summary] = obj.name.split(":");
        let defaultValue = (types[name] || { processed_simple: "value" })
          .processed_simple;
        if (["direct", "descendant", "ancestor"].includes(summary)) {
          summary = defaultValue;
        }
        obj.summary = summary || defaultValue;
      }
    } else {
      expandedTypes = displayTypes.filter(
        ({ name }) => !emptyBuckets.has(name)
      );
      for (let obj of expandedTypes) {
        obj.summary = "value";
      }
    }
  }

  if (searchResults && searchResults.status && searchResults.status.error) {
    return (
      <div
        style={{
          position: "relative",
          height: "15em",
        }}
      >
        <ReportError report={"search"} error={searchResults.status.error} />
      </div>
    );
  } else if (
    !searchResults.status ||
    !searchResults.status.hasOwnProperty("hits")
  ) {
    return null;
  }
  const location = useLocation();
  useEffect(() => {
    if (!location.search.match("report=")) {
      window.scrollTo(0, 0);
    }
  }, []);
  const navigate = useNavigate();
  const classes = useStyles();
  let sortBy = searchTerm.sortBy || "";
  let sortOrder = searchTerm.sortOrder || "asc";
  const handleRecordClick = (record) => {
    setPreferSearchTerm(false);
    let recordId, searchText;
    if (searchIndex == "assembly") {
      recordId = record.assembly_id;
      searchText = record.assembly_id;
    } else if (searchIndex == "sample") {
      recordId = record.sample_id;
      searchText = record.sample_id;
    } else if (searchIndex == "feature") {
      recordId = record.feature_id;
      searchText = record.feature_id;
    } else {
      recordId = record.taxon_id;
      searchText = record.scientific_name;
    }
    navigate(
      `${basename}/record?recordId=${recordId}&result=${searchIndex}&taxonomy=${taxonomy}#${encodeURIComponent(
        searchText
      )}`
    );
  };

  const handleToggleColSpan = (id, colSpan) => {
    if (colSpan > 1) {
      setSearchDefaults({ expandColumns: { ...expandColumns, [id]: false } });
    } else {
      setSearchDefaults({ expandColumns: { ...expandColumns, [id]: true } });
    }
  };

  const handleToggleExclusion = ({
    toggleAncestral,
    toggleDescendant,
    toggleDirect,
    toggleMissing,
  }) => {
    setPreferSearchTerm(false);
    let options = { ...searchTerm };
    let ancestral = arrToObj(options.excludeAncestral);
    if (toggleAncestral) {
      ancestral[toggleAncestral] = !ancestral[toggleAncestral];
    }
    options.excludeAncestral = [];
    Object.keys(ancestral).forEach((key) => {
      if (ancestral[key]) {
        options.excludeAncestral.push(key);
      }
    });
    let descendant = arrToObj(options.excludeDescendant);
    if (toggleDescendant) {
      descendant[toggleDescendant] = !descendant[toggleDescendant];
    }
    options.excludeDescendant = [];
    Object.keys(descendant).forEach((key) => {
      if (descendant[key]) {
        options.excludeDescendant.push(key);
      }
    });
    let direct = arrToObj(options.excludeDirect);
    if (toggleDirect) {
      direct[toggleDirect] = !direct[toggleDirect];
    }
    options.excludeDirect = [];
    Object.keys(direct).forEach((key) => {
      if (direct[key]) {
        options.excludeDirect.push(key);
      }
    });
    let missing = arrToObj(options.excludeMissing);
    if (toggleMissing) {
      missing[toggleMissing] = !missing[toggleMissing];
    }
    options.excludeMissing = [];
    Object.keys(missing).forEach((key) => {
      if (missing[key]) {
        options.excludeMissing.push(key);
      }
    });
    navigate(
      `${basename}/search?${qs.stringify(options)}${location.hash || ""}`
    );
  };
  const arrToObj = (arr) => {
    let obj = {};
    if (arr) {
      arr.forEach((key) => {
        obj[key] = true;
      });
    }
    return obj;
  };
  const handleTableSort = ({
    sortBy,
    sortOrder,
    toggleAncestral,
    toggleDescendant,
    toggleDirect,
    toggleMissing,
  }) => {
    let options = { ...searchTerm };
    if (sortBy && sortBy != "") {
      options.sortBy = sortBy;
      options.sortOrder = sortOrder;
    } else if (sortBy) {
      delete options.sortBy;
      delete options.sortOrder;
    }
    if (location.search.match(/tax_tree%28/)) {
      options.query = options.query.replace("tax_name", "tax_tree");
    }
    options.offset = 0;
    navigate(
      `${location.pathname}?${qs.stringify(options)}${location.hash || ""}`
    );
  };
  let rows = searchResults.results.map((result) => {
    let name = result.result.scientific_name;
    let currentRecordId = result.result.taxon_id;
    if (
      result.result.taxon_rank == "species" ||
      result.result.taxon_rank == "subspecies"
    ) {
      name = <em>{name}</em>;
    }
    let cells = [
      <Tooltip title={"Click to view record"} arrow key={"name"}>
        <StickyCell
          style={{ cursor: "pointer" }}
          onClick={() => handleRecordClick(result.result)}
        >
          {name}
        </StickyCell>
      </Tooltip>,
      <Tooltip title={"Click to view record"} arrow key={"taxon_id"}>
        <TableCell
          style={{ cursor: "pointer" }}
          onClick={() => handleRecordClick(result.result)}
        >
          {result.result.taxon_id}
        </TableCell>
      </Tooltip>,
    ];
    Object.keys(activeNameClasses).forEach((nameClass) => {
      if (
        result.result.names &&
        result.result.names[nameClass] &&
        result.result.names[nameClass].name
      ) {
        cells.push(
          <TableCell key={nameClass}>
            {result.result.names[nameClass].name}
          </TableCell>
        );
      } else {
        cells.push(<TableCell key={nameClass}>-</TableCell>);
      }
    });

    Object.keys(activeRanks).forEach((rank) => {
      if (
        result.result.ranks &&
        result.result.ranks[rank] &&
        result.result.ranks[rank].scientific_name
      ) {
        cells.push(
          <TableCell key={rank}>
            {result.result.ranks[rank].scientific_name}
          </TableCell>
        );
      } else {
        cells.push(<TableCell key={rank}>-</TableCell>);
      }
    });
    if (searchIndex == "assembly") {
      currentRecordId = result.result.assembly_id;
      cells.push(
        <Tooltip title={"Click to view record"} arrow key={"assembly_id"}>
          <TableCell
            style={{ cursor: "pointer" }}
            onClick={() => handleRecordClick(result.result)}
          >
            {result.result.assembly_id}
          </TableCell>
        </Tooltip>
      );
    }
    if (searchIndex == "sample") {
      currentRecordId = result.result.sample_id;
      cells.push(
        <Tooltip title={"Click to view record"} arrow key={"sample_id"}>
          <TableCell
            style={{ cursor: "pointer" }}
            onClick={() => handleRecordClick(result.result)}
          >
            {result.result.sample_id}
          </TableCell>
        </Tooltip>
      );
    }
    if (searchIndex == "feature") {
      currentRecordId = result.result.feature_id;
      cells = [];
      cells.push(
        <Tooltip title={"Click to view assembly"} arrow key={"assembly_id"}>
          <TableCell
            style={{ cursor: "pointer" }}
            onClick={() => handleRecordClick(result.result)}
          >
            {result.result.assembly_id}
          </TableCell>
        </Tooltip>
      );
      cells.push(
        <Tooltip title={"Click to view feature"} arrow key={"feature_id"}>
          <TableCell
            style={{ cursor: "pointer" }}
            onClick={() => handleRecordClick(result.result)}
          >
            {result.result.feature_id}
          </TableCell>
        </Tooltip>
      );
    }

    expandedTypes.forEach((type) => {
      let colSpan = 1;
      let colCount = type.constraint?.enum?.length || 1;
      if (colCount > 1 && expandColumns[type.name]) {
        colSpan = colCount;
        maxColSpan = Math.max(colSpan, maxColSpan);
      }
      if (
        result.result.fields &&
        result.result.fields.hasOwnProperty(type.name)
      ) {
        let field = result.result.fields[type.name];
        let value = field[type.summary];
        if (colSpan == 1) {
          let entries = [];
          if (Array.isArray(value)) {
            value = formatter(value, searchIndex, "array");
            let charLimit = 20;
            for (let v of value.values) {
              let entry = v[0];
              if (charLimit == 20 || charLimit - entry.length > 0) {
                entries.push(entry);
                charLimit -= entry.length;
              }
            }
            value = entries.join(", ");
            if (field.value.length > 1) {
              length = field.value.length;
            }
          } else {
            value = formatter(value, searchIndex);
          }
          if (
            type.summary == "value" &&
            Array.isArray(field.value) &&
            field.length > entries.length
          ) {
            let badgeContent = `+${field.length - entries.length}`;
            value = (
              <span>
                {value}
                <StyledBadge
                  badgeContent={badgeContent}
                  color={"default"}
                  max={100000}
                >
                  <span style={{ padding: "0 6px", color: "rgba(0,0,0,0" }}>
                    {badgeContent}
                  </span>
                </StyledBadge>
              </span>
            );
          }
          cells.push(
            <TableCell key={type.name}>
              <Grid
                container
                direction="row"
                wrap="nowrap"
                spacing={1}
                alignItems={"center"}
                ref={rootRef}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setAttributeSettings({
                    currentRecordId,
                    attributeId: type.name,
                    showAttribute: true,
                  });
                }}
              >
                {field.aggregation_source && (
                  <Grid item>
                    <AggregationIcon
                      method={field.aggregation_source}
                      hasDescendants={field.has_descendants}
                    />
                  </Grid>
                )}

                <Grid item style={{ whiteSpace: "nowrap" }}>
                  {value}
                </Grid>
              </Grid>
            </TableCell>
          );
        } else {
          let values = (Array.isArray(value) ? value : [value]).map((v) =>
            v.toLowerCase()
          );
          type.constraint.enum.forEach((key, i) => {
            let css = setCellClassName(i, type.constraint.enum.length);
            if (!values.includes(key)) {
              cells.push(
                <OddTableCell key={`${type.name}-${key}-${i}`} className={css}>
                  {/* <CheckBoxOutlineBlankIcon style={{ opacity: 0.25 }} /> */}
                </OddTableCell>
              );
            } else {
              let list = type.value_metadata?.[key]?.icons;
              let icons = [];
              let url = type.value_metadata?.default?.link;
              if (list) {
                if (list.file) {
                  url = list.file?.link || url;
                  icons.push(
                    <DescriptionIcon
                      key="file"
                      style={{
                        fill: statusColors[field.aggregation_source],
                        cursor: "pointer",
                      }}
                      onClick={() => window.open(url)}
                    />
                  );
                }
                if (list.view) {
                  url = list.view?.link || url;
                  icons.push(
                    <VisibilityIcon
                      key="view"
                      style={{
                        fill: statusColors[field.aggregation_source],
                        cursor: "pointer",
                      }}
                    />
                  );
                }
              } else {
                let RadioIcon = RadioButtonCheckedOutlinedIcon;
                let fill = statusColors[field.aggregation_source];
                if (field.aggregation_source == "descendant") {
                  RadioIcon = AdjustIcon;
                } else if (field.aggregation_source == "ancestor") {
                  RadioIcon = RadioButtonUncheckedIcon;
                }
                icons.push(
                  <RadioIcon
                    style={{
                      fill,
                      cursor: "pointer",
                      fontSize: "1.25rem",
                    }}
                    key="check"
                  />
                );
              }
              cells.push(
                <OddTableCell
                  key={`${type.name}-${key}-${i}`}
                  style={{ whiteSpace: "nowrap" }}
                  className={css}
                >
                  {icons}
                </OddTableCell>
              );
            }
          });
        }
      } else {
        for (let i = 0; i < colSpan; i++) {
          let css = setCellClassName(i, colSpan);
          cells.push(
            <OddTableCell key={`${type.name}-${i}`} className={css}>
              {colSpan == 1 && "-"}
            </OddTableCell>
          );
        }
      }
    });
    cells.push(
      <Tooltip title={"Click to view record"} arrow key={"go to record"}>
        <TableCell>
          <IconButton
            aria-label="go to record"
            size="small"
            onClick={() => handleRecordClick(result.result)}
          >
            <KeyboardArrowRightIcon />
          </IconButton>
        </TableCell>
      </Tooltip>
    );
    return <StyledTableRow key={result.id}>{cells}</StyledTableRow>;
  });
  let heads = [
    <SortableCell
      name={"scientific_name"}
      sortDirection={sortBy === "scientific_name" ? sortOrder : false}
      key={"scientific_name"}
      CustomCell={StickyCell}
      {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
    />,
    <SortableCell
      name={"taxon_id"}
      sortDirection={sortBy === "taxon_id" ? sortOrder : false}
      key={"taxon_id"}
      {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
    />,
  ];
  let filters = [
    <ResultFilter
      name={"scientific_name"}
      key={"scientific_name"}
      type="hidden"
      TableCell={StickyCell}
      value={""}
    />,
    <ResultFilter
      name={"taxon_id"}
      key={"taxon_id"}
      type="hidden"
      value={""}
    />,
  ];
  let expandedCols = [
    <StickyCell key={"scientific_name"} />,
    <TableCell key={"taxon_id"} />,
  ];
  let maxColSpan = 1;
  Object.keys(activeNameClasses).forEach((nameClass) => {
    heads.push(
      <SortableCell
        name={nameClass}
        key={nameClass}
        sortDirection={sortBy === nameClass ? sortOrder : false}
        {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
      />
    );
    filters.push(
      <ResultFilter name={nameClass} key={nameClass} value={""} colSpan={1} />
    );
    expandedCols.push(<TableCell key={nameClass} />);
  });
  Object.keys(activeRanks).forEach((rank) => {
    heads.push(
      <SortableCell
        name={rank}
        key={rank}
        sortDirection={sortBy === rank ? sortOrder : false}
        {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
      />
    );
    filters.push(<ResultFilter name={rank} key={rank} value={""} />);
    expandedCols.push(<TableCell key={rank} />);
  });
  if (searchIndex == "assembly" || searchIndex == "feature") {
    heads.push(
      <SortableCell
        name={"assembly_id"}
        key={"assembly_id"}
        sortDirection={sortBy === "assembly_id" ? sortOrder : false}
        {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
      />
    );
    filters.push(
      <ResultFilter name={"assembly_id"} key={"assembly_id"} value={""} />
    );
    expandedCols.push(<TableCell key={"assembly_id"} />);
  }
  if (searchIndex == "sample") {
    heads.push(
      <SortableCell
        name={"sample_id"}
        key={"sample_id"}
        sortDirection={sortBy === "sample_id" ? sortOrder : false}
        {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
      />
    );
    filters.push(
      <ResultFilter name={"sample_id"} key={"sample_id"} value={""} />
    );
    expandedCols.push(<TableCell key={"sample_id"} />);
  }
  if (searchIndex == "feature") {
    heads = [heads.pop()];
    heads.push(
      <SortableCell
        name={"feature_id"}
        key={"feature_id"}
        sortDirection={sortBy === "feature_id" ? sortOrder : false}
        {...{ classes, handleTableSort, searchIndex, sortBy, sortOrder }}
      />
    );
    filters.push(
      <ResultFilter name={"feature_id"} key={"feature_id"} value={""} />
    );
    expandedCols.push(<TableCell key={"feature_id"} />);
  }
  for (let type of expandedTypes) {
    let sortDirection = sortBy === type.name ? sortOrder : false;
    if (type.processed_type == "geo_point") {
    } else {
    }
    let colSpan = 1;
    let colCount = type.constraint?.enum?.length || 1;
    if (colCount > 1 && expandColumns[type.name]) {
      colSpan = colCount;
      maxColSpan = Math.max(colSpan, maxColSpan);
    }
    heads.push(
      <SortableCell
        key={type.name}
        name={type.name}
        description={type.description}
        status={type.status}
        handleTableSort={type.processed_type != "geo_point" && handleTableSort}
        setAttributeSettings={setAttributeSettings}
        showExcludeBoxes={searchIndex == "taxon" ? "all" : "missing"}
        excludeAncestral={arrToObj(searchTerm.excludeAncestral)}
        excludeDescendant={arrToObj(searchTerm.excludeDescendant)}
        excludeDirect={arrToObj(searchTerm.excludeDirect)}
        excludeMissing={arrToObj(searchTerm.excludeMissing)}
        {...{
          classes,
          colCount,
          colSpan,
          handleToggleColSpan,
          handleToggleExclusion,
          searchIndex,
          setAttributeSettings,
          sortBy,
          sortDirection,
          sortOrder,
          statusColors,
        }}
      />
    );
    filters.push(
      <ResultFilter
        key={type.name}
        name={type.name}
        colSpan={colSpan}
        TableCell={colSpan > 1 ? SpanTableCell : TableCell}
        value={""}
        fieldMeta={types[type.name]}
      />
    );
    if (colSpan > 1) {
      type.constraint.enum.forEach((v, i) => {
        let css = setCellClassName(i, type.constraint.enum.length);
        expandedCols.push(
          <OddTableCell key={`${type.name}-${v}`} className={css}>
            {v}
          </OddTableCell>
        );
      });
    } else {
      expandedCols.push(<TableCell key={type.name} colSpan={colSpan} />);
    }
  }
  heads.push(
    <Tooltip title={"Click to toggle filter options"} arrow key={"filter"}>
      <TableCell>
        <IconButton
          aria-label="toggle filter"
          size="small"
          onClick={() =>
            setSearchDefaults({ showFilter: !searchDefaults.showFilter })
          }
        >
          <FilterListIcon />
        </IconButton>
      </TableCell>
    </Tooltip>
  );
  filters.push(<TableCell key={"filter"} />);
  expandedCols.push(<TableCell key={"filter"} />);

  let citationMessage;
  if (rows.length > 0) {
    citationMessage = (
      <Citation resultCount={rows.length} searchTerm={searchTerm} />
    );
  }
  return (
    <Grid
      container
      alignItems="center"
      direction="column"
      spacing={1}
      className={classes.root}
    >
      <Grid item className={classes.table}>
        {/* {searchResults.isFetching ? (
          <Skeleton variant="rect" width={800} height={200} />
        ) : ( */}
        <TableContainer className={styles.resultsTable}>
          <Table size="small" aria-label="search results">
            <TableHead>
              <TableRow>{heads}</TableRow>
              {searchDefaults.showFilter && <TableRow>{filters}</TableRow>}
              {maxColSpan > 1 && <TableRow>{expandedCols}</TableRow>}
            </TableHead>
            <TableBody>{rows}</TableBody>
          </Table>
        </TableContainer>

        {/* )} */}
      </Grid>

      {/* <Grid
        item
        // style={{
        //   display: "flex",
        //   justifyContent: "flex-start",
        //   position: "relative",
        //   overflow: "visible",
        // }}
      > */}
      <Grid
        container
        alignItems="center"
        justifyContent="center"
        direction="row"
        spacing={1}
        className={classes.root}
      >
        <Grid item>
          <LinkButton options={["search", "searchurl"]} />
        </Grid>
        <Grid item>
          <SearchPagination />
        </Grid>
        <Grid item style={{ marginLeft: "auto" }}>
          <DownloadButton
            onButtonClick={saveSearchResults}
            searchTerm={searchTerm}
          />
        </Grid>
        <ResultModalControl
          // currentRecordId={recordId}
          // attributeId={attribute}
          // showAttribute={showAttribute}
          // setShowAttribute={setShowAttribute}
          rootRef={rootRef}
        />
      </Grid>
      {citationMessage}
      {/* </Grid> */}
    </Grid>
  );
};

export default compose(
  dispatchRecord,
  withSiteName,
  withTypes,
  withTaxonomy,
  withColors,
  withSearch,
  withSearchDefaults,
  withRanks,
  withNames
)(ResultTable);
