import React, { memo, useEffect, useState } from "react";

import Grid from "@material-ui/core/Grid";
import SearchInputQuery from "./SearchInputQuery";
import { compose } from "recompose";
import { makeStyles } from "@material-ui/core/styles";
import withInputQueries from "../hocs/withInputQueries";
// import withLiveQuery from "../hocs/withLiveQuery";
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
    fontSize: "2em",
    marginLeft: theme.spacing(1),
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
      key.match(/query[A-Z]+/)
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
        key.match(/query[A-Z]+/)
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
    <Grid item>
      <Grid container direction="column">
        {queryInputs}
      </Grid>
    </Grid>
  );
};

export default compose(
  memo,
  withSearch,
  withLookup,
  withInputQueries
  // withLiveQuery
)(SearchInputQueries);
