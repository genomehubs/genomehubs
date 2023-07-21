import { ListSubheader, MenuItem } from "@material-ui/core";
import React, { useEffect, useState } from "react";

import AutoCompleteInput from "./AutoCompleteInput";
import BasicSelect from "./BasicSelect";
import BasicTextField from "./BasicTextField";
import Button from "@material-ui/core/Button";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import Switch from "@material-ui/core/Switch";
import Tooltip from "./Tooltip";
import Typography from "@material-ui/core/Typography";
import VariableFilter from "./VariableFilter";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import { makeStyles } from "@material-ui/core/styles";
import qs from "../functions/qs";
import { setSearchTerm } from "../reducers/search";
import { useNavigate } from "@reach/router";
import withLookup from "../hocs/withLookup";
import withSearch from "../hocs/withSearch";
import withSearchDefaults from "../hocs/withSearchDefaults";
import withSiteName from "../hocs/withSiteName";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

export const useStyles = makeStyles((theme) => ({
  paper: {
    width: "100%",
    minWidth: "600px",
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    boxShadow: "none",
  },
  formControl: {
    margin: theme.spacing(2),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  label: {
    color: "rgba(0, 0, 0, 0.54)",
  },
}));

const QueryBuilder = ({
  searchTerm,
  searchIndex,
  setSearchIndex,
  setSearchDefaults,
  setLookupTerm,
  setPreferSearchTerm,
  indices,
  taxonomy,
  types,
  basename,
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  let ranks = {
    "": "",
    superkingdom: "superkingdom",
    kingdom: "kingdom",
    phylum: "phylum",
    class: "class",
    order: "order",
    family: "family",
    genus: "genus",
    species: "species",
    subspecies: "subspecies",
  };
  let taxFilters = {
    taxon: null,
    filter: "tax_name",
    rank: "",
    level: null,
  };
  const [index, setIndex] = useState(searchIndex);
  let [attrFilters, setAttrFilters] = useState([]);
  let [taxFilter, setTaxFilter] = useState(taxFilters);
  let bool = false;

  useEffect(() => {
    let attributes = [];
    if (searchTerm.query) {
      searchTerm.query.split(/\s*AND\s*/).forEach((term) => {
        let taxQuery = term.match(/tax_(\w+)\((.+?)\)/);
        if (taxQuery) {
          if (taxQuery[1] == "rank") {
            taxFilters.rank = taxQuery[2] || "";
            bool = "AND";
          } else if (taxQuery[1] == "depth") {
            taxFilters.depth = taxQuery[2];
          } else {
            taxFilters.taxon = taxQuery[2];
            taxFilters.filter = `tax_${taxQuery[1]}`;
          }
        } else {
          let parts = term.split(/\s*([\>\<=]+)\s*/);
          if (parts[0].endsWith("!")) {
            parts[1] = `!${parts[1]}`;
            parts[0] = parts[0].replace("!", "");
          }
          attributes.push(parts);
        }
      });
    }
    setAttrFilters(attributes);
    setTaxFilter(taxFilters);
  }, []);

  const handleIndexChange = (e) => {
    let options = qs.parse(location.search.replace(/^\?/, ""));
    e.stopPropagation();
    setSearchIndex(e.target.value);
    setSearchDefaults({
      includeEstimates: false,
      includeDescendant: false,
    });
    navigate(
      `${basename}/search?${qs.stringify({
        taxonomy: options.taxonomy,
        query: "null",
        result: e.target.value,
      })}`
    );
  };

  const buildQuery = () => {
    let query = "";
    if (taxFilter.rank || taxFilter.depth) {
      taxFilter.filter = "tax_tree";
    }
    if (taxFilter.taxon) {
      query = `${taxFilter.filter}(${taxFilter.taxon})`;
      if (taxFilter.rank || taxFilter.depth) {
        query += " AND ";
      }
    }
    if (taxFilter.rank) {
      query += `tax_rank(${taxFilter.rank})`;
      if (taxFilter.depth) {
        query += " AND ";
      }
    }
    if (taxFilter.depth) {
      query += `tax_depth(${taxFilter.depth})`;
    }
    let newFilters = "";
    let newFilterArray = [];
    attrFilters.forEach((parts, i) => {
      newFilterArray.push(parts.join(""));
    });
    if (newFilterArray.length > 0) {
      newFilters = taxFilter.taxon || taxFilter.rank ? " AND " : "";
      newFilters += newFilterArray.join(" AND ");
    }
    query += newFilters;
    return query;
  };

  const handleChange = (e, i, action, value) => {
    value = value || e.target.value;
    if (!value) {
      return;
    }
    let attributes = [...attrFilters];
    let attribute = attributes[i] || [""];
    if (action == "summary") {
      attribute[0] = attribute[0]
        .replace(/\w+\s*\(\s*/, "")
        .replace(/\s*\)\s*$/, "");
      if (value != "value") {
        attribute[0] = `${value}(${attribute[0]})`;
      }
    } else if (action == "variable") {
      let [summary, attr] = attribute[0].split(/\s*[\(\)]\s*/);
      // if (attr) {
      //   attribute[0] = `${summary}(${attribute[0]})`;
      // } else {
      attribute[0] = value;
      attribute[1] = "";
      attribute[2] = "";
      // }
    } else if (action == "operator") {
      attribute[1] = value;
    } else if (action == "value") {
      attribute[2] = value;
    }
    if (action == "dismiss") {
      delete attributes[i];
    } else {
      attributes[i] = attribute;
    }
    setAttrFilters(attributes);
  };

  let filterOptions = [];
  let variableValues = {};
  let keywordValues = {};
  let allValues = {};
  const variableTypes = [
    "long",
    "integer",
    "short",
    "byte",
    "double",
    "float",
    "half_float",
    "scaled_float",
    "keyword",
  ];
  Object.keys(types).forEach((key) => {
    let type = types[key];
    allValues[key] = key;
    if (variableTypes.includes(type.type)) {
      variableValues[key] = key;
    } else if (types.type == "keyword") {
      keywordValues[key] = key;
    }
  });
  let variables = [];
  let sortedTypes = Object.entries(types).sort(([aKey, aVal], [bKey, bVal]) => {
    let group = (aVal.display_group || "ZZZ").localeCompare(
      bVal.display_group || "ZZZ"
    );
    if (group == 0) {
      return aKey.localeCompare(bKey);
    }
    return group;
  });
  let groupedTypes = sortedTypes.reduce((grouped, [key, obj]) => {
    let group = obj.display_group || "other";
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(key);
    return grouped;
  }, {});
  let attrs = [];
  Object.entries(groupedTypes).forEach(([group, values]) => {
    variables.push(<ListSubheader key={`g-${group}`}>{group}</ListSubheader>);
    values.forEach((value) => {
      attrs.push(value);
      variables.push(
        <MenuItem key={value} value={value}>
          {value}
        </MenuItem>
      );
    });
  });

  attrFilters.forEach((parts, i) => {
    let summary = "value";
    let attr = parts[0];
    if (!types[attr] && !attr.endsWith("_id")) {
      [summary, attr] = attr.split(/[\(\))]/);
    }
    if (attr) {
      let extra = [];
      if (!attrs.includes(attr)) {
        extra = [
          <MenuItem key={attr} value={attr}>
            {attr}
          </MenuItem>,
        ];
      }
      filterOptions.push(
        <VariableFilter
          key={i}
          field={attr}
          fields={variables.concat(extra)}
          operator={parts[1]}
          value={parts[2]}
          summary={summary}
          bool={bool}
          types={types}
          handleVariableChange={(e) => handleChange(e, i, "variable")}
          handleSummaryChange={(e) => handleChange(e, i, "summary")}
          handleOperatorChange={(e) => handleChange(e, i, "operator")}
          handleValueChange={(e, obj = {}) => {
            let { id, value } = obj;
            return handleChange(e, i, "value", value);
          }}
          handleDismiss={(e) => handleChange(e, i, "dismiss")}
        />
      );
    }
  });
  filterOptions.push(
    <Grid container alignItems="center" direction="row" spacing={2} key={"new"}>
      {bool && (
        <Grid item>
          <Typography>{bool}</Typography>
        </Grid>
      )}
      <Grid item>
        <BasicSelect
          current={""}
          id={`new-variable-select`}
          handleChange={(e) => handleChange(e, attrFilters.length, "variable")}
          helperText={"field"}
          values={variables}
        />
      </Grid>
    </Grid>
  );

  let [moreOptions, setMoreOptions] = useState(() => {
    let opts = { ...searchTerm };
    if (!opts.includeEstimates || opts.includeEstimates == "false") {
      opts.includeEstimates = false;
    } else {
      opts.includeEstimates = true;
    }
    opts.offset = 0;
    delete opts.query;
    return opts;
  });

  const handleTaxonFilterChange = (e, props = {}) => {
    let { id, value } = props;
    if (!id) {
      e.stopPropagation();
      id = e.target.id ? e.target.id.replace("taxon-filter-", "") : "rank";
      value = e.target.value;
    } else {
      id = id.replace("taxon-filter-", "");
    }
    if (id == "estimates") {
      setMoreOptions({
        ...moreOptions,
        includeEstimates: e.target.checked,
      });
    }
    if (id == "filter") {
      value = e.target.checked ? "tax_tree" : "tax_eq";
    } else if (id == "rank") {
      if (value != "") {
        setMoreOptions({
          ...moreOptions,
          includeEstimates: true,
        });
      }
    }
    setTaxFilter({
      ...taxFilter,
      [id]: value,
    });
  };

  const handleClick = () => {
    let query = buildQuery();
    let options = {
      ...moreOptions,
      query,
      result: index,
      taxonomy,
    };
    let includeDescendants = options.includeDescendants;
    let includeEstimates = options.includeEstimates;
    setSearchDefaults({
      includeDescendants,
      includeEstimates,
    });
    setPreferSearchTerm(false);
    navigate(
      `${basename}/search?${qs.stringify(options)}#${encodeURIComponent(
        options.query
      )}`
    );
  };
  return (
    <Paper className={classes.paper}>
      <Grid container alignItems="center" direction="column" spacing={2}>
        <Grid container direction="row">
          <Grid item>
            <BasicSelect
              current={index}
              id={"search-index-select"}
              handleChange={handleIndexChange}
              helperText={"search index"}
              values={{
                ...(indices.includes("taxon") && { Taxon: "taxon" }),
                ...(indices.includes("sample") && { Sample: "sample" }),
                ...(indices.includes("assembly") && { Assembly: "assembly" }),
                ...(indices.includes("feature") && { Feature: "feature" }),
              }}
            />
          </Grid>
        </Grid>
        <Grid container alignItems="center" direction="row" spacing={2}>
          <Tooltip title="Taxon ID or scientific name" arrow placement={"top"}>
            <Grid item xs={3}>
              {/* <BasicTextField
                id={"taxon-filter-taxon"}
                handleChange={handleTaxonFilterChange}
                helperText={"taxon"}
                value={taxFilter.taxon}
              />
               */}
              <AutoCompleteInput
                id={"taxon-filter-taxon"}
                inputValue={taxFilter.taxon}
                setInputValue={() => {}}
                inputLabel={"taxon"}
                // inputRef={refs[queryProp]}
                handleSubmit={handleTaxonFilterChange}
                size={"small"}
                maxRows={1}
                result={"taxon"}
                fixedType={{ type: "taxon" }}
                // doSearch={doSearch}
              />
            </Grid>
          </Tooltip>
          {taxFilter.taxon && (
            <Tooltip
              title={`Toggle switch to ${
                taxFilter.filter == "tax_tree"
                  ? "exclude descendant taxa from"
                  : "include descendant taxa in"
              } results`}
              arrow
              placement={"top"}
            >
              <Grid item>
                <FormControl className={classes.formControl}>
                  <FormControlLabel
                    className={classes.label}
                    control={
                      <Switch
                        id={"taxon-filter-filter"}
                        checked={taxFilter.filter == "tax_tree"}
                        onChange={handleTaxonFilterChange}
                        name="filter-type"
                        color="default"
                      />
                    }
                    label={taxFilter.filter == "tax_tree" ? "On" : "Off"}
                  />
                  <FormHelperText>{"include descendants"}</FormHelperText>
                </FormControl>
              </Grid>
            </Tooltip>
          )}
          <Tooltip
            title="Restrict results to a given taxonomic rank"
            arrow
            placement={"top"}
          >
            <Grid item>
              <BasicSelect
                id={"taxon-filter-rank"}
                handleChange={handleTaxonFilterChange}
                helperText={"rank"}
                current={taxFilter.rank}
                values={ranks}
              />
            </Grid>
          </Tooltip>
          <Tooltip
            title={`Toggle switch to ${
              moreOptions.includeEstimates
                ? "exclude taxa with only estimated values from"
                : "include all taxa in"
            } results`}
            arrow
            placement={"top"}
          >
            <Grid item>
              <FormControl className={classes.formControl}>
                <FormControlLabel
                  className={classes.label}
                  control={
                    <Switch
                      id={"taxon-filter-estimates"}
                      checked={moreOptions.includeEstimates}
                      onChange={handleTaxonFilterChange}
                      name="filter-estimates"
                      color="default"
                    />
                  }
                  label={moreOptions.includeEstimates ? "On" : "Off"}
                />
                <FormHelperText>{"include estimates"}</FormHelperText>
              </FormControl>
            </Grid>
          </Tooltip>
          <Tooltip
            title="Limit search to a given number of levels from the root taxon"
            arrow
            placement={"top"}
          >
            <Grid item>
              <BasicTextField
                id={"taxon-filter-depth"}
                handleChange={handleTaxonFilterChange}
                helperText={"depth"}
                value={taxFilter.depth}
              />
            </Grid>
          </Tooltip>
        </Grid>
        {filterOptions}
        <Grid container alignItems="flex-end" direction="row">
          <Grid item>
            <Button
              variant="contained"
              color="default"
              disableElevation
              className={classes.button}
              startIcon={<SearchIcon />}
              onClick={handleClick}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default compose(
  withSiteName,
  dispatchLookup,
  withTypes,
  withTaxonomy,
  withSearch,
  withSearchDefaults,
  withLookup
)(QueryBuilder);
