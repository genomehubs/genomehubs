import React, { useEffect, useRef, useState } from "react";

import AutoCompleteInput from "./AutoCompleteInput";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Grid from "@mui/material/Grid2";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import SettingsButton from "./SettingsButton";
import Slider from "@mui/material/Slider";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import dispatchReport from "../hocs/dispatchReport";
import { getSuggestedTerm } from "../reducers/search";
import qs from "../functions/qs";
import withReportById from "../hocs/withReportById";
import withSiteName from "../hocs/withSiteName";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

const suggestedTerm = getSuggestedTerm();

const xSettings = {
  prop: "x",
  label: `tax_tree(${suggestedTerm}) AND assembly_span`,
  required: true,
};
const rankSettings = {
  prop: "rank",
  label: "family",
  required: true,
  except: ["feature", "assembly", "sample"],
};
const catSettings = { prop: "cat", label: "assembly_level" };
const pointSizeSettings = {
  prop: "pointSize",
  label: "point size",
  defaultValue: 15,
  min: 10,
  max: 25,
  step: 5,
};

const nestedQueries = [
  "queryA",
  "queryB",
  "queryC",
  "queryD",
  "queryE",
  "queryF",
  "queryG",
  "queryH",
  "queryI",
  "queryJ",
];

export const queryPropList = {
  histogram: [
    "report",
    xSettings,
    ...nestedQueries,
    rankSettings,
    catSettings,
    "includeEstimates",
    "yScale",
    "xOpts",
    "stacked",
    "cumulative",
    pointSizeSettings,
    "compactLegend",
    "catToX",
    "compactWidth",
    "result",
    "taxonomy",
  ],
  map: [
    "report",
    xSettings,
    ...nestedQueries,
    rankSettings,
    catSettings,
    "includeEstimates",
    "mapThreshold",
    "result",
    "taxonomy",
  ],
  oxford: [
    "report",
    xSettings,
    ...nestedQueries,
    catSettings,
    "xOpts",
    "plotRatio",
    pointSizeSettings,
    "compactLegend",
    "reorient",
    "compactWidth",
    "result",
    "taxonomy",
  ],
  ribbon: [
    "report",
    xSettings,
    ...nestedQueries,
    catSettings,
    "xOpts",
    "plotRatio",
    pointSizeSettings,
    "compactLegend",
    "reorient",
    "dropShadow",
    "compactWidth",
    "result",
    "taxonomy",
  ],
  scatter: [
    "report",
    xSettings,
    ...nestedQueries,
    { prop: "y", label: `c_value`, required: true },
    rankSettings,
    catSettings,
    "includeEstimates",
    "zScale",
    "xOpts",
    "yOpts",
    "highlightArea",
    "stacked",
    "plotRatio",
    "scatterThreshold",
    pointSizeSettings,
    "compactLegend",
    "compactWidth",
    "result",
    "reversed",
    "taxonomy",
  ],
  table: [
    "report",
    xSettings,
    ...nestedQueries,
    { prop: "y", label: `c_value` },
    rankSettings,
    catSettings,
    "includeEstimates",
    "xOpts",
    "yOpts",
    "cumulative",
    // "reversed",
    "result",
    "taxonomy",
  ],
  tree: [
    "report",
    { ...xSettings, label: `tax_tree(${suggestedTerm})` },
    ...nestedQueries,
    { prop: "y", label: `c_value` },
    catSettings,
    { prop: "levels", label: "family, order, phylum" },
    "includeEstimates",
    "collapseMonotypic",
    "hideSourceColors",
    "hideErrorBars",
    "hideAncestralBars",
    "showPhylopics",
    "phylopicRank"  ,
    "phylopicSize",
    "yOpts",
    "treeStyle",
    "treeThreshold",
    pointSizeSettings,
    "result",
    "taxonomy",
  ],
  arc: [
    "report",
    "x",
    ...nestedQueries,
    "y",
    "z",
    rankSettings,
    "includeEstimates",
    pointSizeSettings,
    "compactLegend",
    "compactWidth",
    "result",
    "taxonomy",
  ],
  xPerRank: [
    "report",
    "x",
    ...nestedQueries,
    rankSettings,
    "includeEstimates",
    "result",
    "taxonomy",
  ],
};

const autoCompleteTypes = {
  x: false,
  y: false,
  rank: { type: "rank" },
  cat: { type: "cat" },
};

const reportTypes = [
  "histogram",
  "map",
  "oxford",
  "ribbon",
  "scatter",
  "table",
  "tree",
  "arc",
  "xPerRank",
];

const reversibleProps = new Set(["rank", "cat"]);

export const ReportEdit = ({
  reportId,
  reportById,
  report,
  setReportEdit,
  fetchReport,
  modal,
  handleUpdate,
  types,
  basename,
}) => {
  const formRef = useRef();
  const [values, setValues] = useState({});
  let query = qs.parse(reportById.report?.queryString);
  if (query.report == "tree" && !query.treeStyle) {
    query.treeStyle = "rect";
  }
  if (query.report == "scatter" && !query.plotRatio) {
    query.plotRatio = "auto";
  }
  let { result } = query;

  let props = queryPropList[report];

  const defaultState = setQueryProps(query, report, types);
  useEffect(() => {
    if (Object.keys(values).length == 0) {
      setValues(defaultState());
    }
    if (!props.includes("xField")) {
      props.splice(2, 0, "xField");
    }
  }, [query, report, reportById]);

  let fields = [];
  if (
    Object.keys(values).length == 0 ||
    !reportById.report ||
    !reportById.report.queryString
  ) {
    return null;
  }

  const handleChange = (e, queryProp, value) => {
    if (value) {
      // use given value
    } else if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
      value = e.target.value;
    } else {
      value = "";
    }
    setValues({ ...values, [queryProp]: value });
  };

  const setInputValue = (value, queryProp) => {
    setValues({ ...values, [queryProp]: value });
  };

  const toggleSwitch = (e, queryProp) => {
    e.preventDefault();
    e.stopPropagation();
    setValues({
      ...values,
      [queryProp]: !(values[queryProp] && values[queryProp] != "false"),
    });
  };

  const handleKeyPress = (e) => {
    if (e.key == "Enter" || e.keyCode == 13) {
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
    }
    setReportEdit(false);
    if (!formRef.current.reportValidity()) {
      return;
    }
    let prevQuery = qs.parse(location.search.replace(/^\?+/, ""));
    let queryObj = Object.fromEntries(
      Object.entries(values).filter(([k, v]) => {
        if (v != "") {
          return true;
        } else {
          delete prevQuery[k];
          return false;
        }
      }),
    );
    if (
      !values.hasOwnProperty("includeEstimates") ||
      values.includeEstimates == "" ||
      values.includeEstimates == "false" ||
      values.includeEstimates == false
    ) {
      queryObj.includeEstimates = false;
    } else {
      queryObj.includeEstimates = true;
    }
    if (queryObj.xField && !queryObj.x.startsWith(`${queryObj.xField} AND`)) {
      let currentX = "";
      for (let part of queryObj.x.split(/\s+/)) {
        if (types.hasOwnProperty(part)) {
          currentX = part;
          break;
        }
      }
      if (queryObj.xField != currentX) {
        queryObj.x = `${queryObj.xField} AND ${queryObj.x}`;
      }
      delete queryObj.xField;
    }
    if (!location.pathname.startsWith(basename + "/report")) {
      queryObj.query = queryObj.query || queryObj.x;
      if (queryObj.x) {
        delete queryObj.x;
      }
      if (queryObj.rank && !queryObj.query.match("tax_rank")) {
        queryObj.query += ` AND tax_rank(${queryObj.rank})`;
      }
    }

    let hash = queryObj.query;
    let newQueryString = qs.stringify({
      ...prevQuery,
      ...queryObj,
      // result: "taxon",
      // taxonomy,
    });

    if (modal) {
      fetchReport({
        reportId,
        queryString: newQueryString,
        reload: true,
        report,
      });
    } else {
      handleUpdate({ queryString: newQueryString, hash });
    }
  };
  const handleReset = (e) => {
    e.preventDefault();
    setValues(defaultState);
  };

  let toggles = [];

  const reverseIcon = ({ queryProp }) => {
    if (!reversibleProps.has(queryProp)) {
      return;
    }
    if (!values[queryProp] || !values[queryProp].match(/\S\s*,\s*\S/)) {
      return;
    }
    const reverseValues = (value) => {
      let [prefix, suffix] = value.split(/=/);
      if (suffix) {
        return `${prefix}=${suffix.split(",").reverse().join(",")}`;
      }
      return value.split(",").reverse().join(",");
    };
    return (
      <Tooltip title={"click to reverse list order"} arrow placement={"top"}>
        <SwapHorizIcon
          style={{ cursor: "pointer", float: "right" }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setInputValue(reverseValues(values[queryProp] || ""), queryProp);
            // if (document.activeElement !== inputRef.current) {
            //   inputRef.current.focus();
            // }
          }}
        />
      </Tooltip>
    );
  };

  for (let queryProp of props) {
    let except, input, icon, label, required, min, max, step;
    if (Array.isArray(queryProp)) {
      required = true;
      queryProp = queryProp[0];
    } else if (typeof queryProp === "object" && queryProp !== null) {
      ({
        prop: queryProp,
        label,
        required,
        except,
        min,
        max,
        step,
      } = queryProp);
    }

    if (except && except.includes(result)) {
      continue;
    }

    if (
      queryProp.match(/^query[A-Z]$/) ||
      queryProp == "result" ||
      queryProp == "taxonomy"
    ) {
      continue;
    }

    if (queryProp == "report") {
      let items = reportTypes.map((rep) => {
        return (
          <MenuItem key={rep} value={rep}>
            {rep}
          </MenuItem>
        );
      });
      input = (
        <Grid
          container
          spacing={1}
          direction="row"
          sx={{ flexGrow: 1, width: "95%" }}
        >
          <Grid size={{ xs: "grow" }}>
            <FormControl variant="standard" style={{ width: "100%" }}>
              <InputLabel id="select-report-label">report</InputLabel>
              <Select
                variant="standard"
                labelId="select-report-label"
                id="select-report"
                value={values["report"]}
                sx={{ minWidth: "95%" }}
                onChange={(e) => handleChange(e, "report")}
              >
                {items}
              </Select>
            </FormControl>
          </Grid>
          <Grid align={"right"} key={"submit"} size={{ xs: "grow" }}>
            <SettingsButton
              handleClick={handleSubmit}
              handleResetClick={handleReset}
            />
          </Grid>
        </Grid>
      );
    } else if (queryProp == "treeStyle") {
      let items = ["rect", "ring"].map((shape) => {
        return (
          <MenuItem key={shape} value={shape}>
            {shape}
          </MenuItem>
        );
      });
      input = (
        <FormControl variant="standard" style={{ width: "95%" }}>
          <InputLabel id="select-tree-style-label">treeStyle</InputLabel>
          <Select
            variant="standard"
            labelId="select-tree-style-label"
            id="select-tree-style"
            value={values["treeStyle"]}
            style={{ width: "95%" }}
            onChange={(e) => handleChange(e, "treeStyle")}
          >
            {items}
          </Select>
        </FormControl>
      );
    } else if (queryProp == "plotRatio") {
      let items = ["auto", 1, 1.5, 2].map((value) => {
        return (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        );
      });
      input = (
        <FormControl variant="standard" style={{ width: "95%" }}>
          <InputLabel id="select-plot-ratio-label">plotRatio</InputLabel>
          <Select
            variant="standard"
            labelId="select-plot-ratio-label"
            id="select-plot-ratio"
            value={values["plotRatio"]}
            style={{ width: "95%" }}
            onChange={(e) => handleChange(e, "plotRatio")}
          >
            {items}
          </Select>
        </FormControl>
      );
    }
      else if(queryProp=="phylopicRank"){
        input = (
          <TextField
            variant="standard"
            id={queryProp + Math.random()}
            label="PhyloPic Rank"
            value={values[queryProp] || ""}
            style={{ width: "95%" }}
            onChange={(e) => handleChange(e, "phylopicRank")}
            onBlur={(e) => handleChange(e, "phylopicRank")}
            onKeyPress={handleKeyPress}
            helperText="Taxonomic rank to display PhyloPics (e.g. species, genus, family, order, phylum, kingdom, etc. - empty = tip nodes)"
          />
        );
      }
      else if(queryProp=="phylopicSize"){
        const treeStyle = values["treeStyle"] || "rect";
        const sizeDefaults = {
          rect: { min: 15, max: 100, default:25, step: 5 },  
          ring: { min: 20, max: 250, default: 100, step: 10 } 
        }[treeStyle];
        const helpText = `Size in pixels (${sizeDefaults.min}-${sizeDefaults.max}, empty = auto-sized based on available space)`;
        input = (
          <TextField
            variant="standard"
            id={queryProp + Math.random()}
            label="PhyloPic Size (pixels)"
            type="number"
            value={values[queryProp] || ""}
            style={{ width: "95%" }}
            onChange={(e) => handleChange(e, "phylopicSize")}
            onBlur={(e) => handleChange(e, "phylopicSize")}
            onKeyPress={handleKeyPress}
            inputProps={{ 
              min: sizeDefaults.min, 
              max: sizeDefaults.max, 
              step: sizeDefaults.step 
            }}
            helperText={helpText}
          />
        );
      }
     else if (
      queryProp == "includeEstimates" ||
      queryProp == "stacked" ||
      queryProp == "cumulative" ||
      queryProp == "reversed" ||
      queryProp == "collapseMonotypic" ||
      queryProp == "hideSourceColors" ||
      queryProp == "hideErrorBars" ||
      queryProp == "hideAncestralBars" ||
      queryProp == "showPhylopics" ||
      queryProp == "compactLegend" ||
      queryProp == "reorient" ||
      queryProp == "dropShadow" ||
      queryProp == "catToX"
    ) {
      toggles.push(
        <div style={{ float: "left", marginRight: "2em" }} key={queryProp}>
          <FormControl variant="standard" key={queryProp}>
            <FormControlLabel
              control={
                <Switch
                  id={`report-${queryProp}`}
                  checked={Boolean(
                    values[queryProp] && values[queryProp] != "false",
                  )}
                  onClick={(e) => toggleSwitch(e, queryProp)}
                  name={queryProp}
                  color="default"
                />
              }
              label={
                values[queryProp] && values[queryProp] != "false" ? "On" : "Off"
              }
            />

            <FormHelperText>{queryProp}</FormHelperText>
          </FormControl>
        </div>,
      );
    } else if (queryProp.endsWith("Scale")) {
      input = (
        <RadioGroup
          aria-label={queryProp}
          name={queryProp}
          value={values[queryProp] || "linear"}
          onClick={(e) => handleChange(e, queryProp)}
          row
        >
          <FormControlLabel
            value="linear"
            control={<Radio color="default" />}
            label="linear"
            key={"linear"}
          />
          <FormControlLabel
            value="sqrt"
            control={<Radio color="default" />}
            label="sqrt"
            key={"sqrt"}
          />
          <FormControlLabel
            value="log10"
            control={<Radio color="default" />}
            label="log10"
            key={"log10"}
          />
          <FormControlLabel
            value="proportion"
            control={<Radio color="default" />}
            label="proportion"
            key={"linproportionear"}
          />
        </RadioGroup>
      );
    } else {
      if (label && !values[queryProp]) {
        label = `${queryProp} - e.g. ${label}`;
      } else {
        label = queryProp;
      }

      if (min) {
        toggles.push(
          <div
            style={{
              float: "left",
              paddingTop: "0.7em",
              marginRight: "2em",
              paddingLeft: "0.75em",
            }}
            key={queryProp}
          >
            <FormControl variant="standard">
              <Slider
                id={queryProp + Math.random()}
                value={values[queryProp] * 1}
                valueLabelDisplay="auto"
                label={label}
                style={{ width: "95%" }}
                required={required}
                error={required && !values[queryProp]}
                onChange={(e, value) => handleChange(e, queryProp, value)}
                step={step}
                marks
                min={min}
                max={max}
              />
              <FormHelperText>{queryProp}</FormHelperText>
            </FormControl>
          </div>,
        );
      } else if (autoCompleteTypes.hasOwnProperty(queryProp)) {
        icon = reverseIcon({ queryProp });
        input = (
          <AutoCompleteInput
            id={queryProp + Math.random()}
            required={required}
            error={required && !values[queryProp]}
            inputValue={values[queryProp] || ""}
            setInputValue={(value) => setInputValue(value, queryProp)}
            inputLabel={label}
            inputRef={false}
            multiline={false}
            setMultiline={() => {}}
            handleSubmit={(e, { value }) => handleChange(e, queryProp, value)}
            size={"small"}
            multipart={queryProp == "x"}
            maxRows={queryProp == "x" ? 5 : 1}
            fixedType={autoCompleteTypes[queryProp]}
            // doSearch={doSearch}
            // inputProps={(value) =>
            //   setInputProps({
            //     label,
            //     queryProp,
            //     value,
            //   })
            // }
          />
        );
      } else {
        icon = reverseIcon({ queryProp });
        input = (
          <TextField
            variant="standard"
            id={queryProp + Math.random()}
            label={label}
            value={values[queryProp]}
            required={required}
            error={required && !values[queryProp]}
            style={{ width: "95%" }}
            onChange={(e) => handleChange(e, queryProp)}
            onBlur={(e) => handleChange(e, queryProp)}
            onKeyPress={handleKeyPress}
          />
        );
      }
    }
    if (input) {
      fields.push(
        <Grid
          style={{ width: "95%" }}
          key={`input-${queryProp}`}
          justifyContent="flex-end"
          alignItems="flex-end"
          container
          direction="row"
        >
          <Grid size={icon ? 11 : 12}>{input}</Grid>
          {icon && (
            <Grid style={{ color: "#777c78" }} size={1}>
              {icon}
            </Grid>
          )}
        </Grid>,
      );
    }
  }
  if (toggles.length > 0) {
    fields.push(
      <Grid align="left" key={"toggles"}>
        {toggles}
      </Grid>,
    );
  }
  fields.push(
    <Grid align="right" key={"submit"}>
      <div>&nbsp;</div>
      <SettingsButton
        handleClick={handleSubmit}
        handleResetClick={handleReset}
      />
    </Grid>,
  );
  return (
    <Box
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto",
        overflowX: "visible",
      }}
    >
      <form ref={formRef}>{fields}</form>
    </Box>
  );
};

export default compose(
  withSiteName,
  withTaxonomy,
  withTypes,
  withReportById,
  dispatchReport,
)(ReportEdit);

export const setQueryProps = (query, report, types) => {
  return () => {
    let obj = {};
    if (!query || !report || !queryPropList[report]) {
      return obj;
    }
    for (let queryProp of queryPropList[report]) {
      let prop;
      let defaultValue = "";
      if (Array.isArray(queryProp)) {
        prop = queryProp[0];
      } else if (typeof queryProp === "object" && queryProp !== null) {
        ({ prop, defaultValue } = queryProp);
      } else {
        prop = queryProp;
      }
      if (prop == "xField") {
        continue;
      }
      if (prop == "report" && query[prop] == "xInY") {
        query[prop] = "arc";
      }
      obj[prop] = query.hasOwnProperty(prop) ? query[prop] : defaultValue;
      if (prop == "x" && obj[prop]) {
        obj.xField = "";
        for (let part of obj[prop].split(/\s+/)) {
          if (types.hasOwnProperty(part)) {
            obj.xField = part;
            break;
          }
        }
      }
    }
    return obj;
  };
};
