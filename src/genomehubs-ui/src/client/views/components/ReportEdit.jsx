import React, { useEffect, useRef, useState } from "react";

import AutoCompleteInput from "./AutoCompleteInput";
import Box from "@material-ui/core/Box";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import Select from "@material-ui/core/Select";
import SettingsButton from "./SettingsButton";
import Slider from "@material-ui/core/Slider";
import Switch from "@material-ui/core/Switch";
import TextField from "@material-ui/core/TextField";
import { compose } from "recompose";
import dispatchReport from "../hocs/dispatchReport";
import { getSuggestedTerm } from "../reducers/search";
import { makeStyles } from "@material-ui/core/styles";
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

export const queryPropList = {
  histogram: [
    "report",
    xSettings,
    rankSettings,
    catSettings,
    "includeEstimates",
    "yScale",
    "xOpts",
    "stacked",
    "cumulative",
    pointSizeSettings,
  ],
  map: [
    "report",
    xSettings,
    rankSettings,
    catSettings,
    "includeEstimates",
    "mapThreshold",
  ],
  oxford: ["report", xSettings, catSettings, "xOpts", pointSizeSettings],
  scatter: [
    "report",
    xSettings,
    { prop: "y", label: `c_value`, required: true },
    rankSettings,
    catSettings,
    "includeEstimates",
    "zScale",
    "xOpts",
    "yOpts",
    "highlightArea",
    "stacked",
    "scatterThreshold",
    pointSizeSettings,
  ],
  table: [
    "report",
    xSettings,
    { prop: "y", label: `c_value` },
    rankSettings,
    catSettings,
    "includeEstimates",
    "xOpts",
    "yOpts",
    "cumulative",
    // "reversed",
  ],
  tree: [
    "report",
    { ...xSettings, label: `tax_tree(${suggestedTerm})` },
    { prop: "y", label: `c_value` },
    catSettings,
    { prop: "levels", label: "family, order, phylum" },
    "includeEstimates",
    "collapseMonotypic",
    "yOpts",
    "treeStyle",
    "treeThreshold",
    pointSizeSettings,
  ],
  arc: [
    "report",
    ["x"],
    "y",
    rankSettings,
    "includeEstimates",
    pointSizeSettings,
  ],
  xPerRank: ["report", "x", rankSettings, "includeEstimates"],
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
  "scatter",
  "table",
  "tree",
  "arc",
  "xPerRank",
];

export const useStyles = makeStyles((theme) => ({
  label: {
    color: "rgba(0, 0, 0, 0.54)",
  },
}));

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
  const classes = useStyles();
  const formRef = useRef();
  const [values, setValues] = useState({});
  let query = qs.parse(reportById.report?.queryString);
  if (query.report == "tree" && !query.treeStyle) {
    query.treeStyle = "rect";
  }
  let result = query.result;

  let props = queryPropList[report];

  const defaultState = () => {
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
      [queryProp]:
        values[queryProp] && values[queryProp] != "false" ? false : true,
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
      })
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
      if (queryObj.x) delete queryObj.x;
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

  for (let queryProp of props) {
    let except, input, label, required, min, max, step;
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

    if (queryProp == "report") {
      let items = reportTypes.map((rep) => {
        return (
          <MenuItem key={rep} value={rep}>
            {rep}
          </MenuItem>
        );
      });
      input = (
        <FormControl style={{ width: "95%" }}>
          <InputLabel id="select-report-label">report</InputLabel>
          <Select
            labelId="select-report-label"
            id="select-report"
            value={values["report"]}
            style={{ width: "95%" }}
            onChange={(e) => handleChange(e, "report")}
          >
            {items}
          </Select>
        </FormControl>
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
        <FormControl style={{ width: "95%" }}>
          <InputLabel id="select-tree-style-label">treeStyle</InputLabel>
          <Select
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
    } else if (
      queryProp == "includeEstimates" ||
      queryProp == "stacked" ||
      queryProp == "cumulative" ||
      queryProp == "reversed" ||
      queryProp == "collapseMonotypic"
    ) {
      toggles.push(
        <div style={{ float: "left", marginRight: "2em" }} key={queryProp}>
          <FormControl key={queryProp}>
            <FormControlLabel
              className={classes.label}
              control={
                <Switch
                  id={`report-${queryProp}`}
                  checked={Boolean(
                    values[queryProp] && values[queryProp] != "false"
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
        </div>
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
            style={{ float: "left", paddingTop: "0.7em", marginRight: "2em" }}
            key={queryProp}
          >
            <FormControl>
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
          </div>
        );
      } else if (autoCompleteTypes.hasOwnProperty(queryProp)) {
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
          />
        );
      } else {
        input = (
          <TextField
            id={queryProp + Math.random()}
            label={label}
            value={values[queryProp]}
            required={required}
            error={required && !values[queryProp]}
            style={{ width: "95%" }}
            onChange={(e) => handleChange(e, queryProp)}
            onKeyPress={handleKeyPress}
          />
        );
      }
    }
    if (input) {
      fields.push(
        <Grid item style={{ width: "95%" }} key={`input-${queryProp}`}>
          {input}
        </Grid>
      );
    }
  }
  if (toggles.length > 0) {
    fields.push(
      <Grid item align="left" key={"toggles"}>
        {toggles}
      </Grid>
    );
  }
  fields.push(
    <Grid item align="right" key={"submit"}>
      <SettingsButton
        handleClick={handleSubmit}
        handleResetClick={handleReset}
      />
    </Grid>
  );
  return (
    // <Grid
    //   container
    //   direction="column"
    //   style={{ height: "100%", width: "100%" }}
    // >
    <Box
      style={{
        height: "100%",
        width: "100%",
        overflowY: "auto",
        overflowX: "none",
      }}
    >
      <form ref={formRef}>{fields}</form>
    </Box>
    // </Grid>
  );
};

export default compose(
  withSiteName,
  withTaxonomy,
  withTypes,
  withReportById,
  dispatchReport
)(ReportEdit);
