import React, { memo, useRef, useState } from "react";

import AutoCompleteInput from "./AutoCompleteInput";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid2";
import { compose } from "redux";
import makeStyles from "@mui/styles/makeStyles";
import withInputQueries from "../hocs/withInputQueries";
import withSearch from "../hocs/withSearch";

export const useStyles = makeStyles((theme) => ({
  icon: {
    color: "black", // theme.palette.text.secondary,
    marginRight: "16px",
  },
  formControl: {
    marginTop: "16px",
    minWidth: "600px",
  },
  search: {
    fontSize: "1.5em",
    marginLeft: "8px",
    backgroundColor: "inherit",
  },
}));

const SearchInputQuery = ({
  id,
  searchIndex,
  inputQueries,
  setInputQueries,
}) => {
  const classes = useStyles();
  const inputRef = useRef(null);
  const [value, setValue] = useState(inputQueries[id]?.query || "");

  if (Array.isArray(id)) {
    return null;
  }

  const handleValueChange = (query) => {
    setInputQueries({ id, query });
    setValue(query);
  };
  return (
    <Grid container direction="row" size={12} style={{ marginBottom: "1em" }}>
      <Grid size={2}></Grid>
      <Grid size={8}>
        <FormControl
          variant="standard"
          className={classes.formControl}
          style={{ width: "100%" }}
        >
          <AutoCompleteInput
            size={"small"}
            required
            inputClassName={"inputQuery"}
            inputValue={value}
            setInputValue={handleValueChange}
            onBlur={(e) => handleValueChange(e.target.value)}
            handleSubmit={(e) => handleValueChange(e.target.value)}
            inputRef={inputRef}
            inputLabel={id}
            inputName={id}
            multiline={false}
            setMultiline={() => {}}
            result={searchIndex}
            multipart={true}
          />
        </FormControl>
      </Grid>
      <Grid size={2}></Grid>
    </Grid>
  );
};

export default compose(memo, withSearch, withInputQueries)(SearchInputQuery);
