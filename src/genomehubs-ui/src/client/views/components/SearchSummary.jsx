import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import React from "react";
import Select from "@mui/material/Select";
import Skeleton from '@mui/material/Skeleton';
import classnames from "classnames";
import { compose } from "recompose";
import makeStyles from '@mui/styles/makeStyles';
import styles from "./Styles.scss";
import withSearch from "../hocs/withSearch";
import withTypes from "../hocs/withTypes";

const SearchSummary = ({ searchTerm, searchResults }) => {
  if (!searchResults.status || !searchResults.status.hasOwnProperty("hits")) {
    return null;
  }
  const count = searchResults.status.hits;
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel,
    styles.flexCenter,
    styles.flexCenterHorizontal,
    styles.fullWidth
  );

  let summary;

  return (
    <div className={css}>
      <Grid container alignItems="center">
        {searchResults.isFetching ? (
          <Grid item style={{ minWidth: "150px" }}>
            <Skeleton variant="text" />
          </Grid>
        ) : (
          <Grid item>
            {count} result{count >= 1 ? (count == 1 ? ":" : "s:") : "s"}
          </Grid>
        )}
      </Grid>
    </div>
  );
};

export default compose(withTypes, withSearch)(SearchSummary);
