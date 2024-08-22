import React, { memo, useEffect, useRef, useState } from "react";

import { Grid } from "@mui/material";
import { compose } from "recompose";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import withSiteName from "../hocs/withSiteName";

const Citation = ({ basename, searchTerm, resultCount }) => {
  const navigate = useNavigate();
  if (resultCount == 0) {
    return null;
  }

  const showSources = (e) => {
    e.preventDefault();
    navigate(
      `${basename}/search?${qs.stringify({
        ...searchTerm,
        report: "sources",
      })}#${encodeURIComponent(searchTerm.query || searchTerm.x)}`
    );
  };
  let sourcesLink;
  if (!searchTerm.report || searchTerm.report != "sources") {
    sourcesLink = (
      <a
        href=""
        onClick={showSources}
        className={styles.link}
        style={{ textDecoration: "underline" }}
      >
        sources
      </a>
    );
  } else {
    sourcesLink = <a>sources</a>;
  }
  return (
    <Grid
      container
      direction="row"
      justifyContent={"center"}
      style={{ marginBottom: "-1em" }}
    >
      <Grid item>
        <a>Please cite the </a>
        {sourcesLink}
      </Grid>
    </Grid>
  );
};

export default compose(withSiteName)(Citation);
