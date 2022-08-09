import React, { memo, useEffect, useRef, useState } from "react";

import AutoCompleteInput from "./AutoCompleteInput";
import FormControl from "@material-ui/core/FormControl";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Popper from "@material-ui/core/Popper";
import SearchIcon from "@material-ui/icons/Search";
import SearchToggles from "./SearchToggles";
import Tooltip from "@material-ui/core/Tooltip";
import { compose } from "recompose";
import { getSuggestedTerm } from "../reducers/search";
import { makeStyles } from "@material-ui/core/styles";
import qs from "../functions/qs";
import { useNavigate } from "@reach/router";
import { useReadLocalStorage } from "usehooks-ts";
import withInputQueries from "../hocs/withInputQueries";
import withLiveQuery from "../hocs/withLiveQuery";
import withLookup from "../hocs/withLookup";
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
            // handleSubmit={handleSubmit}
            // doSearch={doSearch}
            // setLiveQuery={setLiveQuery}
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
