import Grid from "@mui/material/Grid2";
import React from "react";
import { compose } from "redux";
import { link as linkStyle } from "./Styles.scss";
import qs from "../functions/qs";
import { useNavigate } from "@reach/router";
import withSiteName from "#hocs/withSiteName";

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
      })}#${encodeURIComponent(searchTerm.query || searchTerm.x)}`,
    );
  };
  let sourcesLink;
  if (!searchTerm.report || searchTerm.report != "sources") {
    sourcesLink = (
      <a
        href=""
        onClick={showSources}
        className={linkStyle}
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
      size={12}
    >
      <Grid>
        <a>Please cite the </a>
        {sourcesLink}
      </Grid>
    </Grid>
  );
};

export default compose(withSiteName)(Citation);
