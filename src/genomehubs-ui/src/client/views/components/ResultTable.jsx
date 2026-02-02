import {
  EvenTableCell,
  OddTableCell,
  SortableCell,
  SpanTableCell,
  StickyCell,
  StyledBadge,
  StyledTableRow,
  TableCell,
  darkColor,
  lightColor,
  useStyles,
} from "./ResultTable/StyledComponents";
import {
  aggregationTogleOpaque as aggregationToggleOpaqueStyle,
  aggregationToggle as aggregationToggleStyle,
  contrast as contrastStyle,
  first as firstStyle,
  last as lastStyle,
  resultsTable as resultsTableStyle,
} from "./Styles.scss";
import { useEffect, useRef } from "react";

import AggregationIcon from "./AggregationIcon";
import Citation from "./Citation";
import FiberManualRecordSharpIcon from "@mui/icons-material/FiberManualRecordSharp";
import FilterListIcon from "@mui/icons-material/FilterList";
import GetAppIcon from "@mui/icons-material/GetApp";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import RadioButtonCheckedOutlinedIcon from "@mui/icons-material/RadioButtonCheckedOutlined";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ReportError from "./ReportError";
import ResultFilter from "./ResultFilter";
import ResultModalControl from "./ResultModalControl";
import SearchPagination from "./SearchPagination";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "./Tooltip";
import VisibilityIcon from "@mui/icons-material/Visibility";
import classnames from "classnames";
import { compose } from "redux";
import dispatchRecord from "#hocs/dispatchRecord";
import expandFieldList from "#functions/expandFieldList";
import { formatter } from "#functions/formatter";
import qs from "#functions/qs";
import { useLocation } from "@reach/router";
import useNavigate from "#hooks/useNavigate";
import { useTableFooter } from "./ResultTable/useTableFooter";
import { useTableHeaders } from "./ResultTable/useTableHeaders";
import { useTableRows } from "./ResultTable/useTableRows";
import withColors from "#hocs/withColors";
import withNames from "#hocs/withNames";
import withRanks from "#hocs/withRanks";
import withSearch from "#hocs/withSearch";
import withSearchDefaults from "#hocs/withSearchDefaults";
import withSiteName from "#hocs/withSiteName";
import withTaxonomy from "#hocs/withTaxonomy";
import withTypes from "#hocs/withTypes";

const borderColor = "#dddddd";

const setCellClassName = (i, length, force) => {
  if (length == 1 && !force) {
    return "";
  }
  let css = i % 2 == 1 ? contrastStyle : "";
  if (i == 0) {
    css = classnames(css, firstStyle);
  }
  if (i == length - 1) {
    css = classnames(css, lastStyle);
  }
  return css;
};

export const setLinkIcons = ({
  type,
  key,
  result,
  record = { test: "test" },
}) => {
  if (!type.file_paths) {
    return [];
  }
  let parts = type.field.split(".");
  if (parts.length == 1) {
    if (type.file_paths[key]) {
      let { color } = type.file_paths[key];
      if (type.file_paths[key].all) {
        return [{ expand: `${type.field}.${key}.all`, color }];
      }
      return [{ expand: `${type.field}.${key}.run`, color }];
    }
    return [{ expand: false }];
  }
  if (parts.length != 3 || !type.file_paths[parts[1]]) {
    return [];
  }

  let run = parts[2];
  // let { color } = type.file_paths[parts[1]] || {};
  if (run == "run") {
    parts[2] = key;
    return [{ expand: parts.join("."), color: type.color }];
  }
  if (!type.file_paths[parts[1]][key]) {
    return [];
  }

  let { name, links } = type.file_paths[parts[1]][key];
  return links.map(({ icon, pattern, title }) => {
    let arr = pattern.split(/[\{\}]/);
    arr.forEach((item, i) => {
      if (i % 2 == 1) {
        if (item == "run") {
          arr[i] = run;
        } else if (item == "name") {
          arr[i] = name;
        } else if (result) {
          if (result.hasOwnProperty(item)) {
            arr[i] = result[item];
          } else if (result.result.hasOwnProperty(item)) {
            arr[i] = result.result[item];
          } else if (result.result.fields.hasOwnProperty(item)) {
            arr[i] = result.result.fields[item].value;
          } else {
            let bits = item.split(".");
            let field = bits.shift();
            if (result.result.fields.hasOwnProperty(field)) {
              arr[i] =
                result.result.fields[field][`metadata.${bits.join(".")}`];
            }
          }
        } else if (record) {
          if (record.hasOwnProperty(item)) {
            arr[i] = record[item];
          } else if (record.record.hasOwnProperty(item)) {
            arr[i] = record.record[item];
          } else if (record.record.attributes.hasOwnProperty(item)) {
            arr[i] = record.result.attributes[item].value;
          } else {
            let bits = item.split(".");
            let field = bits.shift();
            if (record.result?.attributes?.hasOwnProperty(field)) {
              arr[i] =
                record.result.attributes[field][`metadata.${bits.join(".")}`];
            }
          }
        }
      }
    });
    return {
      icon,
      color: type.color,
      url: arr.join(""),
      title,
    };
  });
};

const findLastIndex = ({ name, field, expandedTypes }) => {
  let index = expandedTypes.findIndex(({ name: n }) => n == name);
  let parts = field.split(".");
  for (let i = index + 1; i < expandedTypes.length; i++) {
    if (parts.length > 1 && parts[parts.length - 1] != "run") {
      if (expandedTypes[i].field.startsWith(`${parts[0]}.${parts[1]}`)) {
        index = i;
      }
    } else if (expandedTypes[i].field.startsWith(`${name}.`)) {
      index = i;
    } else {
      break;
    }
  }
  return index;
};

const formatCellValue = ({
  value,
  type,
  field,
  searchIndex,
  charLimit = 20,
}) => {
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
    let badgeLength = (badgeContent.length + 1) * 8;
    value = (
      <div
        style={{ paddingRight: `${badgeLength}px`, display: "inline-block" }}
      >
        <StyledBadge badgeContent={badgeContent} max={100000}>
          <span style={{ display: "inline-block", position: "relative" }}>
            {value}
          </span>
        </StyledBadge>
      </div>
    );
  }
  return value;
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
  const expandColumns =
    searchDefaults.expandColumns ||
    (searchTerm.expand || "")
      .split(",")
      .reduce((a, b) => ({ ...a, [b]: true }), {});
  let expandedTypes = [];
  let emptyBuckets = new Set();
  let constraints = {};
  if (searchResults.aggs?.fields) {
    emptyBuckets = new Set(
      Object.entries(searchResults.aggs.fields.by_key.buckets)
        .filter(([_, obj]) => obj.doc_count == 0)
        .map(([key, obj]) => key),
    );
    for (let [key, value] of Object.entries(
      searchResults.aggs.fields.by_key.buckets,
    )) {
      let { buckets, sum_other_doc_count } = value.value_list;
      if (buckets.length >= 1) {
        constraints[key] = buckets.map(({ key }) => key);
      }
      if (sum_other_doc_count >= 1) {
        constraints[key].push("other");
      }
    }
    for (let [key, value] of Object.entries(searchResults.aggs.fields)) {
      if (key.endsWith("_metadata")) {
        for (let [path, obj] of Object.entries(value).filter(
          ([p]) => p != "doc_count",
        )) {
          constraints[path] = obj.buckets.map(({ key }) => key);
          if (obj.sum_other_doc_count >= 1) {
            constraints[path].push("other");
          }
        }
      }
    }
  }
  if (searchTerm) {
    if (searchTerm.fields) {
      let fieldList = expandFieldList({ fields: searchTerm.fields, types });
      expandedTypes = displayTypes
        .filter(({ name }) => !emptyBuckets.has(name) && name != "none")
        .map(({ name, ...rest }) => ({
          name,
          field: name,
          ...structuredClone({ rest }),
        }));
      for (let field of fieldList) {
        let name, summary;
        if (field.includes(":")) {
          [name, summary] = field.split(":");
        } else if (field.includes(".")) {
          [name, ...summary] = field.split(".");
          summary = `metadata.${summary.join(".")}`;
        } else if (!searchTerm.fields.includes(field)) {
          expandedTypes.push({
            name: field,
            field,
            summary: "value",
          });
          continue;
        } else {
          continue;
        }
        let index = findLastIndex({ name, field, expandedTypes });
        let defaultValue = (types[name] || { processed_simple: "value" })
          .processed_simple;
        expandedTypes.splice(index + 1, 0, {
          ...expandedTypes[index],
          name: field.includes(".") ? name : `${name}:${summary}`,
          summary: summary || defaultValue,
          field,
        });
      }
      for (let obj of expandedTypes) {
        let { name, field, summary, file_paths } = obj;
        if (name != field && file_paths) {
          let [_, key] = field.split(".");
          let { color } = file_paths[key] || {};
          obj.color = color;
        }
        name = name.replace(/:.+/, "");
        let defaultValue = (types[name] || { processed_simple: "value" })
          .processed_simple;
        if (["direct", "descendant", "ancestor"].includes(summary)) {
          summary = defaultValue;
        }
        obj.summary = summary || defaultValue;
      }
    } else {
      expandedTypes = displayTypes
        .filter(({ name }) => !emptyBuckets.has(name))
        .map((obj) => structuredClone(obj));
      for (let obj of expandedTypes) {
        obj.summary = "value";
        obj.field = obj.name;
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
      `record?recordId=${recordId}&result=${searchIndex}&taxonomy=${taxonomy}#${encodeURIComponent(
        searchText,
      )}`,
    );
  };

  const handleToggleColSpan = (id, colSpan, linked) => {
    // currently unable to make this persist without a page reload
    if (linked) {
      let fields = searchTerm.fields
        ? searchTerm.fields.split(",")
        : displayTypes.map((d) => d.name);
      let expand = expandColumns;
      let newExpandColumns = { ...expandColumns };

      if (!fields.includes(id)) {
        let prefix = id.replace(/\.[^\.]+$/, "");
        fields = fields.filter(
          (f) =>
            !f.startsWith(prefix) ||
            f == `${prefix}.run` ||
            f == `${prefix}.all`,
        );

        newExpandColumns = Object.entries(expandColumns)
          .map(([k, v]) => {
            if (
              k.startsWith(prefix) &&
              k != `${prefix}.run` &&
              k != `${prefix}.all`
            ) {
              return [k, false];
            }
            return [k, v];
          })
          .reduce((a, [k, v]) => ({ ...a, [k]: v }), {});
        expand = Object.entries(newExpandColumns)
          .filter(([k, v]) => v)
          .map(([k]) => k);
        if (id == `${prefix}.all`) {
          fields.push(`${prefix}.run`);
          // expand.push(`${prefix}.run`);
          // newExpandColumns[`${prefix}.run`] = true;
        }
        fields.push(id);
        expand.push(id);
        fields = [...new Set(fields)];
        newExpandColumns[id] = true;
      } else if (colSpan > 0) {
        let prefix = id.replace(/\.run$/, "").replace(/\.all$/, "");
        fields = fields.filter((f) => !f.startsWith(prefix));
        newExpandColumns = Object.entries(expandColumns)
          .map(([k, v]) => {
            if (k.startsWith(prefix)) {
              return [k, false];
            }
            return [k, v];
          })
          .reduce((a, [k, v]) => ({ ...a, [k]: v }), {});
        expand = Object.entries(newExpandColumns)
          .filter(([k, v]) => v)
          .map(([k]) => k);
      }
      setSearchDefaults({ expandColumns: newExpandColumns });

      if (fields != searchTerm.fields) {
        navigate(
          `${basename}${location.pathname}?${qs.stringify({
            ...searchTerm,
            expand: expand.join(","),
            fields: fields.join(","),
          })}`,
        );
      }
    } else {
      let newExpandColumns = { ...expandColumns };
      if (colSpan > 0) {
        newExpandColumns[id] = false;
        setSearchDefaults({ expandColumns: newExpandColumns });
      } else {
        newExpandColumns[id] = true;
        setSearchDefaults({ expandColumns: newExpandColumns });
      }
      // let expand = Object.entries(newExpandColumns)
      //   .filter(([k, v]) => v)
      //   .map(([k]) => k);
      // navigate(
      //   `${basename}${location.pathname}?${qs.stringify({
      //     ...searchTerm,
      //     expand: expand.join(","),
      //   })}`
      // );
    }
  };

  const handleToggleExclusion = ({
    toggleAncestral,
    toggleDescendant,
    toggleDirect,
    toggleMissing,
  }) => {
    setPreferSearchTerm(false);
    let options = { ...searchTerm, offset: 0 };
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
    navigate(`search?${qs.stringify(options)}${location.hash || ""}`);
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
      `${location.pathname}?${qs.stringify(options)}${location.hash || ""}`,
    );
  };

  // Enable sorting for msearch results - sorts within each group individually
  const handleTableSortOrDisabled = handleTableSort;

  const setColSpan = ({ type, maxColSpan = 0 }) => {
    let [name, summary] = type.name.split(":");
    let fullName = type.field.match(/\./) ? type.field : name;
    let fieldName = name;
    if (type.return_type) {
      if (!summary) {
        summary = type.return_type;
      } else {
        fieldName = `${name}:${summary}`;
      }
    }
    let colSpan = 0;
    let colCount = 0;
    if (!summary || summary == "value") {
      colCount = constraints[fullName]?.length || 0;
    }
    if (colCount > 0 && expandColumns[type.field]) {
      colSpan = colCount;
      maxColSpan = Math.max(colSpan, maxColSpan);
    }
    return { fieldName, summary, colCount, colSpan, maxColSpan };
  };

  let { heads, filters, expandedCols, maxColSpan } = useTableHeaders({
    activeNameClasses,
    activeRanks,
    searchIndex,
    expandedTypes,
    expandColumns,
    constraints,
    searchDefaults,
    searchTerm,
    types,
    sortBy,
    sortOrder,
    classes,
    handleTableSort: handleTableSortOrDisabled,
    handleToggleColSpan,
    handleToggleExclusion,
    setAttributeSettings,
    statusColors,
    setSearchDefaults,
    setCellClassName,
    setColSpan,
  });

  let rows = useTableRows({
    searchResults,
    searchIndex,
    expandedTypes,
    expandColumns,
    constraints,
    activeNameClasses,
    activeRanks,
    statusColors,
    rootRef,
    setAttributeSettings,
    formatCellValue,
    setCellClassName,
    setColSpan,
    setLinkIcons,
    handleRecordClick,
    handleToggleColSpan,
  });

  let citationMessage;
  if (rows.length > 0) {
    citationMessage = (
      <Citation resultCount={rows.length} searchTerm={searchTerm} />
    );
  }

  let footer = useTableFooter({
    rows,
    searchTerm,
    saveSearchResults,
    rootRef,
    classes,
  });
  return (
    <Grid
      container
      alignItems="center"
      direction="column"
      spacing={1}
      className={classes.root}
    >
      <Grid className={classes.table}>
        {/* {searchResults.isFetching ? (
          <Skeleton variant="rect" width={800} height={200} />
        ) : ( */}
        <TableContainer className={resultsTableStyle}>
          <Table size="small" aria-label="search results">
            <TableHead>
              <TableRow>{heads}</TableRow>
              {searchDefaults.showFilter && <TableRow>{filters}</TableRow>}
              {maxColSpan > 0 && <TableRow>{expandedCols}</TableRow>}
            </TableHead>
            <TableBody>{rows}</TableBody>
          </Table>
        </TableContainer>

        {/* )} */}
      </Grid>

      {footer}
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
  withNames,
)(ResultTable);
