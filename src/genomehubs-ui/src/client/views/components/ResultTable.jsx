import React, { useEffect, useRef } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import { useLocation, useNavigate } from "@reach/router";

import AggregationIcon from "./AggregationIcon";
import Badge from "@material-ui/core/Badge";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import Checkbox from "@material-ui/core/Checkbox";
import Citation from "./Citation";
import DownloadButton from "./DownloadButton";
import FilterListIcon from "@material-ui/icons/FilterList";
import Grid from "@material-ui/core/Grid";
import Grow from "@material-ui/core/Grow";
import IconButton from "@material-ui/core/IconButton";
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";
import LinkButton from "./LinkButton";
import MuiTableCell from "@material-ui/core/TableCell";
import ReportError from "./ReportError";
import ResultFilter from "./ResultFilter";
import ResultModalControl from "./ResultModalControl";
import SearchPagination from "./SearchPagination";
import SettingsApplicationsIcon from "@material-ui/icons/SettingsApplications";
import SettingsIcon from "@material-ui/icons/Settings";
import Skeleton from "@material-ui/lab/Skeleton";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import Tooltip from "./Tooltip";
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
  },
}))(MuiTableCell);

const StyledCheckbox = ({ color, ...props }) => {
  return (
    <Checkbox
      style={{
        padding: "1px",
        color: props.color,
      }}
      icon={
        <CheckBoxOutlineBlankIcon style={{ fontSize: "small", fill: color }} />
      }
      checkedIcon={<CheckBoxIcon style={{ fontSize: "small", fill: color }} />}
      {...props}
    />
  );
};

const StyledColbox = ({ color, ...props }) => {
  return (
    <Checkbox
      style={{
        padding: "1px",
        color: props.color,
      }}
      icon={<SettingsApplicationsIcon style={{ fontSize: "small" }} />}
      checkedIcon={<SettingsIcon style={{ fontSize: "small" }} />}
      {...props}
    />
  );
};

const SortableCell = ({
  name,
  description,
  status,
  classes,
  statusColors = {},
  sortBy,
  sortOrder,
  sortDirection,
  handleTableSort,
  setAttributeSettings,
  showExcludeBoxes,
  excludeDirect,
  excludeAncestral,
  excludeDescendant,
  excludeMissing,
  handleToggleExclusion,
}) => {
  let css = styles.aggregationToggle;
  let prefix = name.replace(/:.+$/, "");
  if (excludeAncestral) {
    if (
      excludeDirect.hasOwnProperty(prefix) ||
      excludeDescendant.hasOwnProperty(prefix) ||
      excludeAncestral.hasOwnProperty(prefix) ||
      excludeMissing.hasOwnProperty(prefix)
    ) {
      css = classnames(
        styles.aggregationToggle,
        styles.aggregationToggleOpaque
      );
    }
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

  return (
    <TableCell
      key={name}
      style={{
        whiteSpace: "normal",
        wordWrap: "break-word",
        maxWidth: "8rem",
        minWidth: "3rem",
        lineHeight: "1rem",
        verticalAlign: "bottom",
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
          {true && (
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
                  color={"blue"}
                  inputProps={{ "aria-label": "show/hide columns" }}
                />
              </span>
            </Tooltip>
          )}
        </span>
      )) || <span className={css}></span>}
    </TableCell>
  );
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
  let expandedTypes = [];
  let emptyBuckets = new Set();
  if (searchResults.aggs) {
    if (searchResults.aggs.fields) {
      emptyBuckets = new Set(
        Object.entries(searchResults.aggs.fields.by_key.buckets)
          .filter(([key, obj]) => obj.doc_count == 0)
          .map(([key]) => key)
      );
    }
  }
  if (searchTerm) {
    if (searchTerm.fields) {
      let fieldList = expandFieldList({ fields: searchTerm.fields, types });
      expandedTypes = fieldList
        .filter((name) => !emptyBuckets.has(name))
        .map((name) => ({
          name,
        }))
        .filter((obj) => obj.name != "none");
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
        <TableCell
          style={{ cursor: "pointer" }}
          onClick={() => handleRecordClick(result.result)}
        >
          {name}
        </TableCell>
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
      if (
        result.result.fields &&
        result.result.fields.hasOwnProperty(type.name)
      ) {
        let field = result.result.fields[type.name];
        let value = field[type.summary];
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
            // if (field.value.length > entries.length) {
            //   value += ", ...";
            // }
          }
        } else {
          value = formatter(value, searchIndex);
        }
        if (
          type.summary == "value" &&
          Array.isArray(field.value) &&
          field.length > entries.length
        ) {
          // let list = entries.join(", ");
          // list = `${list}, ... (${field.length - entries.length} more)`;
          let badgeContent = `+${field.length - entries.length}`;
          value = (
            // <Tooltip title={list} placement="top" arrow>
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
            // </Tooltip>
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
        cells.push(<TableCell key={type.name}>-</TableCell>);
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
      classes={classes}
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortDirection={sortBy === "scientific_name" ? sortOrder : false}
      handleTableSort={handleTableSort}
      key={"scientific_name"}
    />,
    <SortableCell
      name={"taxon_id"}
      classes={classes}
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortDirection={sortBy === "taxon_id" ? sortOrder : false}
      handleTableSort={handleTableSort}
      key={"taxon_id"}
    />,
  ];
  let filters = [
    <ResultFilter
      name={"scientific_name"}
      key={"scientific_name"}
      type="hidden"
      value={""}
    />,
    <ResultFilter
      name={"taxon_id"}
      key={"taxon_id"}
      type="hidden"
      value={""}
    />,
  ];
  Object.keys(activeNameClasses).forEach((nameClass) => {
    heads.push(
      <SortableCell
        name={nameClass}
        key={nameClass}
        classes={classes}
        sortBy={sortBy}
        sortOrder={sortOrder}
        sortDirection={sortBy === nameClass ? sortOrder : false}
        handleTableSort={handleTableSort}
      />
    );
    filters.push(<ResultFilter name={nameClass} key={nameClass} value={""} />);
  });
  Object.keys(activeRanks).forEach((rank) => {
    heads.push(
      <SortableCell
        name={rank}
        key={rank}
        classes={classes}
        sortBy={sortBy}
        sortOrder={sortOrder}
        sortDirection={sortBy === rank ? sortOrder : false}
        handleTableSort={handleTableSort}
      />
    );
    filters.push(<ResultFilter name={rank} key={rank} value={""} />);
  });
  if (searchIndex == "assembly" || searchIndex == "feature") {
    heads.push(
      <SortableCell
        name={"assembly_id"}
        key={"assembly_id"}
        classes={classes}
        sortBy={sortBy}
        sortOrder={sortOrder}
        sortDirection={sortBy === "assembly_id" ? sortOrder : false}
        handleTableSort={handleTableSort}
      />
    );
    filters.push(
      <ResultFilter name={"assembly_id"} key={"assembly_id"} value={""} />
    );
  }
  if (searchIndex == "sample") {
    heads.push(
      <SortableCell
        name={"sample_id"}
        key={"sample_id"}
        classes={classes}
        sortBy={sortBy}
        sortOrder={sortOrder}
        sortDirection={sortBy === "sample_id" ? sortOrder : false}
        handleTableSort={handleTableSort}
      />
    );
    filters.push(
      <ResultFilter name={"sample_id"} key={"sample_id"} value={""} />
    );
  }
  if (searchIndex == "feature") {
    heads = [heads.pop()];
    heads.push(
      <SortableCell
        name={"feature_id"}
        key={"feature_id"}
        classes={classes}
        sortBy={sortBy}
        sortOrder={sortOrder}
        sortDirection={sortBy === "feature_id" ? sortOrder : false}
        handleTableSort={handleTableSort}
      />
    );
    filters.push(
      <ResultFilter name={"feature_id"} key={"feature_id"} value={""} />
    );
  }
  for (let type of expandedTypes) {
    let sortDirection = sortBy === type.name ? sortOrder : false;
    if (type.processed_type == "geo_point") {
    } else {
    }
    heads.push(
      <SortableCell
        key={type.name}
        name={type.name}
        description={type.description}
        status={type.status}
        classes={classes}
        statusColors={statusColors}
        sortBy={sortBy}
        sortOrder={sortOrder}
        sortDirection={sortDirection}
        handleTableSort={type.processed_type != "geo_point" && handleTableSort}
        setAttributeSettings={setAttributeSettings}
        showExcludeBoxes={searchIndex == "taxon" ? "all" : "missing"}
        excludeAncestral={arrToObj(searchTerm.excludeAncestral)}
        excludeDescendant={arrToObj(searchTerm.excludeDescendant)}
        excludeDirect={arrToObj(searchTerm.excludeDirect)}
        excludeMissing={arrToObj(searchTerm.excludeMissing)}
        handleToggleExclusion={handleToggleExclusion}
      />
    );
    filters.push(
      <ResultFilter
        key={type.name}
        name={type.name}
        value={""}
        fieldMeta={types[type.name]}
      />
    );
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
        <TableContainer className={classes.container}>
          <Table size="small" aria-label="search results">
            <TableHead>
              <TableRow>{heads}</TableRow>
              {searchDefaults.showFilter && <TableRow>{filters}</TableRow>}
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
