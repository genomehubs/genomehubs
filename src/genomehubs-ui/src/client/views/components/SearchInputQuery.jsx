import React, { memo, useRef, useState } from "react";

import AutoCompleteInput from "./AutoCompleteInput";
import FormControl from "@material-ui/core/FormControl";
import Grid from "@material-ui/core/Grid";
import { compose } from "recompose";
import { makeStyles } from "@material-ui/core/styles";
import withInputQueries from "../hocs/withInputQueries";
import withSearch from "../hocs/withSearch";

export const useStyles = makeStyles((theme) => ({
  icon: {
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(2),
  },
  formControl: {
    marginTop: theme.spacing(2),
    minWidth: "600px",
  },
  search: {
    fontSize: "1.5em",
    marginLeft: theme.spacing(1),
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
    <Grid container direction="row">
      <Grid item xs={2}></Grid>
      <Grid item xs={"auto"}>
        <FormControl className={classes.formControl}>
          <AutoCompleteInput
            size={"small"}
            required
            inputClassName={"inputQuery"}
            inputValue={value}
            setInputValue={handleValueChange}
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
      <Grid item xs={2}></Grid>
    </Grid>
  );
};

export default compose(memo, withSearch, withInputQueries)(SearchInputQuery);
