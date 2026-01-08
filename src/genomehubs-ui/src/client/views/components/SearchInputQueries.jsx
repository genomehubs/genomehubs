import React, { memo, useEffect, useState } from "react";

import Grid from "@mui/material/Grid2";
import SearchInputQuery from "./SearchInputQuery";
import { compose } from "redux";
import makeStyles from "@mui/styles/makeStyles";
import withInputQueries from "../hocs/withInputQueries";
// import withLiveQuery from "../hocs/withLiveQuery";
import withLookup from "../hocs/withLookup";
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
    fontSize: "2em",
    marginLeft: "8px",
    backgroundColor: "inherit",
  },
}));

const SearchInputQueries = ({
  liveQuery,
  lookupTerm,
  searchTerm,
  inputQueries,
  setInputQueries,
}) => {
  const classes = useStyles();
  const [inputs, setInputs] = useState([
    Object.keys(searchTerm.query || {}).filter((key) =>
      key.match(/query[A-Z]+/),
    ),
  ]);

  useEffect(() => {
    if (liveQuery) {
      let newInputs = Object.keys(searchTerm.query || {})
        .filter((key) => key.match(/query[A-Z]+/))
        .concat(liveQuery.match(/query[A-Z]/g));
      newInputs = [...new Set(newInputs)].sort();
      if (newInputs[0]) {
        setInputs([...new Set(newInputs)].sort());
      } else {
        setInputs([]);
      }
    } else {
      let newInputs = Object.keys(searchTerm.query || {}).filter((key) =>
        key.match(/query[A-Z]+/),
      );
      if (newInputs.length == 0) {
        newInputs = lookupTerm.match(/query[A-Z]/g);
      }
      newInputs = [...new Set(newInputs)].sort();
      for (let id of newInputs) {
        if (searchTerm[id] && !inputQueries[id]) {
          setInputQueries({ id, query: searchTerm[id] });
        }
      }
      if (newInputs[0]) {
        setInputs([...new Set(newInputs)].sort());
      } else {
        setInputs([]);
      }
    }
  }, [liveQuery]);

  let queryInputs = inputs.map((id) => <SearchInputQuery key={id} id={id} />);
  return (
    <Grid size={12}>
      <Grid container direction="column" size={12}>
        {queryInputs}
      </Grid>
    </Grid>
  );
};

export default compose(
  memo,
  withSearch,
  withLookup,
  withInputQueries,
  // withLiveQuery
)(SearchInputQueries);
