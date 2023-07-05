import React, { memo, useEffect, useState } from "react";

import AutoCompleteInput from "./AutoCompleteInput";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Report from "./Report";
import ResultCount from "./ResultCount";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import qs from "../functions/qs";
import { useNavigate } from "@reach/router";

// import classnames from "classnames";

// import styles from "./Styles.scss";

const Template = ({ id, title, description, url, ...props }) => {
  // const [content, setContent] = useState(null);
  const [values, setValues] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let matches = url
      .match(/\{.+?\}/g)
      .map((el) => el.replaceAll(/[\{\}]/g, ""))
      .sort()
      .filter((el, i, arr) => i == arr.indexOf(el));
    let exampleValues = {};
    for (let match of matches) {
      let example = props[`${match}_example`];
      exampleValues[match] = example;
    }
    setValues(exampleValues);
  }, [url]);

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

  const handleKeyPress = (e) => {
    if (e.key == "Enter" || e.keyCode == 13) {
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    e && e.preventDefault();
    let searchUrl = url;
    for (let [key, value] of Object.entries(values)) {
      searchUrl = searchUrl.replaceAll(`{${key}}`, value);
    }
    navigate(searchUrl);
  };

  if (!values || Object.keys(values).length == 0) {
    return null;
  }
  // let css;
  let matches = url
    .match(/\{.+?\}/g)
    .map((el) => el.replaceAll(/[\{\}]/g, ""))
    .sort()
    .filter((el, i, arr) => i == arr.indexOf(el));
  let inputs = [];
  for (let match of matches) {
    let label = props[`${match}_label`];
    let description = props[`${match}_description`];
    let example = props[`${match}_example`];
    let input;
    if (0) {
      // autoCompleteTypes.hasOwnProperty(queryProp)) {
      input = (
        <AutoCompleteInput
          id={match + Math.random()}
          // required={required}
          // error={required && !values[queryProp]}
          inputValue={values[match] || ""}
          setInputValue={(value) => setInputValue(value, match)}
          inputLabel={label}
          inputRef={false}
          multiline={false}
          setMultiline={() => {}}
          handleSubmit={(e, { value }) => handleChange(e, match, value)}
          size={"small"}
          multipart={false}
          maxRows={1}
          // fixedType={autoCompleteTypes[match]}
          // doSearch={doSearch}
        />
      );
    } else {
      input = (
        <TextField
          id={match + Math.random()}
          label={label}
          value={values[match]}
          // required={required}
          // error={required && !values[queryProp]}
          style={{ width: "95%" }}
          onChange={(e) => handleChange(e, match)}
          onKeyPress={handleKeyPress}
        />
      );
    }
    inputs.push(
      <Grid item xs={12} key={match}>
        <Tooltip title={description} arrow>
          {input}
        </Tooltip>
      </Grid>
    );
  }
  let preview;
  if (showPreview) {
    let searchUrl = url;
    for (let [key, value] of Object.entries(values)) {
      searchUrl = searchUrl.replaceAll(`{${key}}`, value);
    }
    let reportProps = qs.parse(decodeURI(searchUrl.split(/[\?#]/)[1]));
    if (reportProps.report) {
      preview = (
        <Grid item xs={12}>
          <Report {...reportProps} caption={" "}></Report>
        </Grid>
      );
    } else {
      preview = (
        <Grid item xs={12}>
          <ResultCount {...reportProps} caption={" "}></ResultCount>
        </Grid>
      );
    }
  }
  return (
    <Grid container direction="column" spacing={1}>
      <Grid item xs={12}>
        <h2>{title}</h2>
        {description}
      </Grid>
      {showPreview && preview}
      {inputs}
      <Grid container direction="row" spacing={1} justifyContent="flex-end">
        <Grid item key={"preview"}>
          <Button
            variant="contained"
            color="default"
            disableElevation
            // className={classes.button}
            startIcon={showPreview ? <VisibilityOffIcon /> : <VisibilityIcon />}
            onClick={(e) => {
              e.preventDefault();
              setShowPreview(!showPreview);
            }}
          >
            {showPreview ? "Hide Preview" : "Preview"}
          </Button>
        </Grid>
        <Grid item key={"submit"}>
          <Button
            variant="contained"
            color="default"
            disableElevation
            // className={classes.button}
            startIcon={<SearchIcon />}
            onClick={handleSubmit}
          >
            Search
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Template;
