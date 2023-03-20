import React, { useEffect, useRef, useState } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";
import { useLocation, useNavigate } from "@reach/router";

import AggregationIcon from "./AggregationIcon";
import Box from "@material-ui/core/TableContainer";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import Checkbox from "@material-ui/core/Checkbox";
import DownloadButton from "./DownloadButton";
import Grid from "@material-ui/core/Grid";
import Grow from "@material-ui/core/Grow";
import IconButton from "@material-ui/core/IconButton";
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";
import LinkButton from "./LinkButton";
import MuiTableCell from "@material-ui/core/TableCell";
import ReportError from "./ReportError";
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
import Tooltip from "@material-ui/core/Tooltip";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchRecord from "../hocs/dispatchRecord";
import { formatter } from "../functions/formatter";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import withColors from "../hocs/withColors";
import withNames from "../hocs/withNames";
import withRanks from "../hocs/withRanks";
import withSearch from "../hocs/withSearch";
import withSiteName from "../hocs/withSiteName";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

const StyledTableRow = withStyles((theme) => ({
  root: {
    width: "100%",
  },
}))(TableRow);

export const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: "100%",
    marginBottom: "1em",
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

  let title = `Sort by ${name}`;
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
        <TableSortLabel
          active={sortBy === name}
          direction={sortOrder}
          onClick={() =>
            handleTableSort({
              sortBy: name,
              sortOrder: sortDirection && sortOrder === "asc" ? "desc" : "asc",
            })
          }
        >
          {/* {name} */}
          {name.split("_").join(`_\u200b`)}
          {status && status != "stable" && <sup>{`\u2020`}</sup>}
          {sortBy === name ? (
            <span className={classes.visuallyHidden}>
              {sortOrder === "desc" ? "sorted descending" : "sorted ascending"}
            </span>
          ) : null}
        </TableSortLabel>
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
  displayTypes,
  fetchSearchResults,
  saveSearchResults,
  searchResults,
  searchTerm,
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
  if (searchTerm) {
    expandedTypes = searchTerm.fields.split(",").map((name) => ({
      name,
    }));
  }

  if (searchResults && searchResults.status.error) {
    return <ReportError report={"search"} error={searchResults.status.error} />;
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
        let value = field.value;
        if (Array.isArray(value)) {
          value = value[0];
        }
        value = formatter(value, searchIndex);
        if (Array.isArray(field.value) && field.length > 1) {
          value = `${value} ...`;
          let list = field.value.slice(0, 3).join(", ");
          if (field.length > 3) {
            if (field.length > 4) {
              list = `${list}, ... (${field.length - 3} more)`;
            } else {
              list = field.value.slice(0, 4).join(", ");
            }
          }
          value = (
            <Tooltip title={list} placement="top" arrow>
              <span>{value}</span>
            </Tooltip>
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
  }
  expandedTypes.forEach((type) => {
    let sortDirection = sortBy === type.name ? sortOrder : false;
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
        handleTableSort={handleTableSort}
        setAttributeSettings={setAttributeSettings}
        showExcludeBoxes={searchIndex == "taxon" ? "all" : "missing"}
        excludeAncestral={arrToObj(searchTerm.excludeAncestral)}
        excludeDescendant={arrToObj(searchTerm.excludeDescendant)}
        excludeDirect={arrToObj(searchTerm.excludeDirect)}
        excludeMissing={arrToObj(searchTerm.excludeMissing)}
        handleToggleExclusion={handleToggleExclusion}
      />
    );
  });
  heads.push(<TableCell key={"last"}></TableCell>);

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
  withRanks,
  withNames
)(ResultTable);
