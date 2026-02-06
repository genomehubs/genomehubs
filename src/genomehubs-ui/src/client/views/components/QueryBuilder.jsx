import { ListSubheader, MenuItem } from "@mui/material";
import { useEffect, useState } from "react";

import AutoCompleteInput from "./AutoCompleteInput";
import BasicSelect from "./BasicSelect";
import BasicTextField from "./BasicTextField";
import Box from "@mui/material/Box";
import ColorButton from "./ColorButton";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Grid from "@mui/material/Grid";
import SearchIcon from "@mui/icons-material/Search";
import Switch from "@mui/material/Switch";
import Tooltip from "./Tooltip";
import Typography from "@mui/material/Typography";
import VariableFilter from "./VariableFilter";
import { compose } from "redux";
import dispatchLookup from "#hocs/dispatchLookup";
import makeStyles from "@mui/styles/makeStyles";
import qs from "#functions/qs";
import useNavigate from "#hooks/useNavigate";
import withLookup from "#hocs/withLookup";
import withSearch from "#hocs/withSearch";
import withSearchDefaults from "#hocs/withSearchDefaults";
import withSiteName from "#hocs/withSiteName";
import withTaxonomy from "#hocs/withTaxonomy";
import withTypes from "#hocs/withTypes";

export const useStyles = makeStyles((theme) => ({
  paper: {
    width: "100%",
    minWidth: "600px",
    padding: "16px",
    marginTop: "16px",
    boxShadow: "none",
  },
  formControl: {
    margin: "16px",
    minWidth: "120px",
  },
  selectEmpty: {
    marginTop: "16px",
  },
}));

const QueryBuilder = ({
  searchTerm,
  searchIndex,
  setSearchDefaults,
  setPreferSearchTerm,
  taxonomy,
  types,
  basename,
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  let ranks = {
    "": "",
    domain: "domain",
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
      attribute[0] = value;
      attribute[1] = "";
      attribute[2] = "";
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
      bVal.display_group || "ZZZ",
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
        </MenuItem>,
      );
    });
  });

  attrFilters.forEach((parts, i) => {
    let summary = "value";
    let attr = parts[0];
    if (!types[attr] && !attr.endsWith("_id")) {
      [summary, attr] = attr.split(/[()]/);
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
        />,
      );
    }
  });
  filterOptions.push(
    <Grid
      container
      alignItems="center"
      direction="row"
      spacing={2}
      key={"new"}
      size={12}
    >
      {bool && (
        <Grid>
          <Typography>{bool}</Typography>
        </Grid>
      )}
      <Grid>
        <BasicSelect
          current={""}
          id={`new-variable-select`}
          handleChange={(e) => handleChange(e, attrFilters.length, "variable")}
          helperText={"field"}
          values={variables}
          sx={{ minWidth: "240px" }}
        />
      </Grid>
    </Grid>,
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
    } else if (id == "rank" && value != "") {
      setMoreOptions({
        ...moreOptions,
        includeEstimates: true,
      });
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
    let { includeDescendants, includeEstimates } = options;
    setSearchDefaults({
      includeDescendants,
      includeEstimates,
    });
    setPreferSearchTerm(false);
    navigate(
      `search?${qs.stringify(options)}#${encodeURIComponent(options.query)}`,
    );
  };
  return (
    <Box className={classes.paper}>
      <Grid container alignItems="center" direction="column" spacing={2}>
        <Grid
          container
          alignItems="center"
          direction="row"
          spacing={2}
          size={12}
        >
          <Tooltip title="Taxon ID or scientific name" arrow placement={"top"}>
            <Grid size={3}>
              <AutoCompleteInput
                id={"taxon-filter-taxon"}
                inputValue={taxFilter.taxon}
                setInputValue={() => {}}
                inputLabel={"taxon"}
                handleSubmit={handleTaxonFilterChange}
                handleBlur={handleTaxonFilterChange}
                size={"small"}
                maxRows={1}
                result={"taxon"}
                fixedType={{ type: "taxon" }}
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
              <Grid>
                <FormControl variant="standard" className={classes.formControl}>
                  <FormControlLabel
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
            <Grid>
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
            <Grid>
              <FormControl variant="standard" className={classes.formControl}>
                <FormControlLabel
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
            <Grid>
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
        <Grid container alignItems="flex-end" direction="row" size={12}>
          <Grid>
            <ColorButton
              variant="contained"
              disableElevation
              className={classes.button}
              startIcon={<SearchIcon />}
              onClick={handleClick}
            >
              Search
            </ColorButton>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default compose(
  withSiteName,
  dispatchLookup,
  withTypes,
  withTaxonomy,
  withSearch,
  withSearchDefaults,
  withLookup,
)(QueryBuilder);
