import {
  flexCenterHorizontal as flexCenterHorizontalStyle,
  flexCenter as flexCenterStyle,
  fullWidth as fullWidthStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  resultPanel as resultPanelStyle,
} from "./Styles.scss";

import Grid from "@mui/material/Grid2";
import React from "react";
import Skeleton from "@mui/material/Skeleton";
import classnames from "classnames";
import { compose } from "recompose";
import withSearch from "../hocs/withSearch";
import withTypes from "../hocs/withTypes";

const SearchSummary = ({ searchTerm, searchResults }) => {
  if (!searchResults.status || !searchResults.status.hasOwnProperty("hits")) {
    return null;
  }
  const count = searchResults.status.hits;
  let css = classnames(
    infoPanelStyle,
    infoPanel1ColumnStyle,
    resultPanelStyle,
    flexCenterStyle,
    flexCenterHorizontalStyle,
    fullWidthStyle
  );

  let summary;

  return (
    <div className={css}>
      <Grid container alignItems="center">
        {searchResults.isFetching ? (
          <Grid style={{ minWidth: "150px" }}>
            <Skeleton variant="text" />
          </Grid>
        ) : (
          <Grid>
            {count} result{count >= 1 ? (count == 1 ? ":" : "s:") : "s"}
          </Grid>
        )}
      </Grid>
    </div>
  );
};

export default compose(withTypes, withSearch)(SearchSummary);
