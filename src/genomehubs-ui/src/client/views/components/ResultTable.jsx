import React, { useEffect } from "react";
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
import SearchPagination from "./SearchPagination";
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
import { formatter } from "../functions/formatter";
import qs from "qs";
import { setPreferSearchTerm } from "../reducers/search";
import styles from "./Styles.scss";
import withNames from "../hocs/withNames";
import withRanks from "../hocs/withRanks";
import withSearch from "../hocs/withSearch";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

const StyledTableRow = withStyles((theme) => ({
  root: {
    width: "100%",
  },
}))(TableRow);

const useStyles = makeStyles((theme) => ({
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

const SortableCell = ({
  name,
  classes,
  sortBy,
  sortOrder,
  sortDirection,
  handleTableSort,
  showExcludeBoxes,
  excludeDirect,
  excludeAncestral,
  excludeDescendant,
  excludeMissing,
  handleToggleExclusion,
}) => {
  let css = styles.aggregationToggle;
  if (excludeAncestral) {
    if (
      excludeDirect.hasOwnProperty(name) ||
      excludeDescendant.hasOwnProperty(name) ||
      excludeAncestral.hasOwnProperty(name) ||
      excludeMissing.hasOwnProperty(name)
    ) {
      css = classnames(
        styles.aggregationToggle,
        styles.aggregationToggleOpaque
      );
    }
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
      <Tooltip key={name} title={`Sort by ${name.replaceAll("_", " ")}`} arrow>
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
          {name.replaceAll("_", " ")}
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
                  checked={!excludeDirect.hasOwnProperty(name)}
                  onChange={() => handleToggleExclusion({ toggleDirect: name })}
                  color={"green"}
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
                  checked={!excludeDescendant.hasOwnProperty(name)}
                  onChange={() =>
                    handleToggleExclusion({ toggleDescendant: name })
                  }
                  color={"orange"}
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
                  checked={!excludeAncestral.hasOwnProperty(name)}
                  onChange={() =>
                    handleToggleExclusion({ toggleAncestral: name })
                  }
                  color={"red"}
                  inputProps={{ "aria-label": "ancestral checkbox" }}
                />
              </span>
            </Tooltip>
          )}
          <Tooltip key={"missing"} title={"Toggle missing values"} arrow>
            <span>
              <StyledCheckbox
                checked={!excludeMissing.hasOwnProperty(name)}
                onChange={() => handleToggleExclusion({ toggleMissing: name })}
                color={"black"}
                inputProps={{ "aria-label": "missing checkbox" }}
              />
            </span>
          </Tooltip>
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
  taxonomy,
}) => {
  if (!searchResults.status || !searchResults.status.hasOwnProperty("hits")) {
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
    } else {
      recordId = record.taxon_id;
      searchText = record.scientific_name;
    }
    navigate(
      `/records?record_id=${recordId}&result=${searchIndex}&taxonomy=${taxonomy}#${encodeURIComponent(
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
    navigate(`/search?${qs.stringify(options)}${location.hash || ""}`);
    // let recordId, searchText;
    // if (searchIndex == "assembly") {
    //   recordId = record.assembly_id;
    //   searchText = record.assembly_id;
    // } else {
    //   recordId = record.taxon_id;
    //   searchText = record.scientific_name;
    // }
    // navigate(
    //   `/sarch?record_id=${recordId}&result=${searchIndex}&taxonomy=${taxonomy}#${encodeURIComponent(
    //     searchText
    //   )}`
    // );
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
    // let ancestral = arrToObj(options.excludeAncestral);
    // if (toggleAncestral) {
    //   ancestral[toggleAncestral] = !ancestral[toggleAncestral];
    // }
    // options.excludeAncestral = [];
    // Object.keys(ancestral).forEach((key) => {
    //   if (ancestral[key]) {
    //     options.excludeAncestral.push(key);
    //   }
    // });
    // let descendant = arrToObj(options.excludeDescendant);
    // if (toggleDescendant) {
    //   descendant[toggleDescendant] = !descendant[toggleDescendant];
    // }
    // options.excludeDescendant = [];
    // Object.keys(descendant).forEach((key) => {
    //   if (descendant[key]) {
    //     options.excludeDescendant.push(key);
    //   }
    // });
    // let direct = arrToObj(options.excludeDirect);
    // if (toggleDirect) {
    //   direct[toggleDirect] = !direct[toggleDirect];
    // }
    // options.excludeDirect = [];
    // Object.keys(direct).forEach((key) => {
    //   if (direct[key]) {
    //     options.excludeDirect.push(key);
    //   }
    // });
    // let missing = arrToObj(options.excludeMissing);
    // if (toggleMissing) {
    //   missing[toggleMissing] = !missing[toggleMissing];
    // }
    // options.excludeMissing = [];
    // Object.keys(missing).forEach((key) => {
    //   if (missing[key]) {
    //     options.excludeMissing.push(key);
    //   }
    // });
    if (location.search.match(/tax_tree%28/)) {
      options.query = options.query.replace("tax_name", "tax_tree");
    }
    options.offset = 0;
    // setPreferSearchTerm(true);
    // setSearchTerm(options);
    navigate(
      `${location.pathname}?${qs.stringify(options)}${location.hash || ""}`
    );
  };
  let rows = searchResults.results.map((result) => {
    let name = result.result.scientific_name;
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
    displayTypes.forEach((type) => {
      if (type.name != "sex_determination_system") {
        if (
          result.result.fields &&
          result.result.fields.hasOwnProperty(type.name)
        ) {
          let field = result.result.fields[type.name];
          let value = field.value;
          if (Array.isArray(value)) {
            value = value[0];
          }
          value = isNaN(value) ? value : formatter(value);
          if (Array.isArray(field.value) && field.count > 1) {
            value = `${value} ...`;
            let list = field.value.slice(0, 3).join(", ");
            if (field.count > 3) {
              list = `${list}, ...`;
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
              >
                <Grid item>
                  <AggregationIcon
                    method={field.aggregation_source}
                    hasDescendants={field.has_descendants}
                  />
                </Grid>

                <Grid item style={{ whiteSpace: "nowrap" }}>
                  {value}
                </Grid>
              </Grid>
            </TableCell>
          );
        } else {
          cells.push(<TableCell key={type.name}>-</TableCell>);
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
  if (searchIndex == "assembly") {
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
  displayTypes.forEach((type) => {
    if (type.name != "sex_determination_system") {
      let sortDirection = sortBy === type.name ? sortOrder : false;
      heads.push(
        <SortableCell
          key={type.name}
          name={type.name}
          classes={classes}
          sortBy={sortBy}
          sortOrder={sortOrder}
          sortDirection={sortDirection}
          handleTableSort={handleTableSort}
          showExcludeBoxes={searchIndex == "taxon" ? "all" : "missing"}
          excludeAncestral={arrToObj(searchTerm.excludeAncestral)}
          excludeDescendant={arrToObj(searchTerm.excludeDescendant)}
          excludeDirect={arrToObj(searchTerm.excludeDirect)}
          excludeMissing={arrToObj(searchTerm.excludeMissing)}
          handleToggleExclusion={handleToggleExclusion}
        />
      );
    }
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
      </Grid>
      {/* </Grid> */}
    </Grid>
  );
};

export default compose(
  withTypes,
  withTaxonomy,
  withSearch,
  withRanks,
  withNames
)(ResultTable);
