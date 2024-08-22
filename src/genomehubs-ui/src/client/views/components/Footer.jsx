import PalettePicker, { PalettePreview } from "./PalettePicker";
import React, { memo, useEffect, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import CopyrightIcon from "@mui/icons-material/Copyright";
import Grid from "@mui/material/Grid";
import { Popover } from "@mui/material";
import Taxonomy from "./Taxonomy";
import bbsrcLogo from "./img/bbsrc-logo.png";
import { compose } from "recompose";
import dispatchRecord from "../hocs/dispatchRecord";
import dispatchTypes from "../hocs/dispatchTypes";
import dtolLogo from "./img/dtol-logo.png";
import qs from "../functions/qs";
import sangerLogo from "./img/sanger-logo.png";
import styles from "./Styles.scss";
import withApi from "../hocs/withApi";
import withColors from "../hocs/withColors";
import withTaxonomy from "../hocs/withTaxonomy";
import withVersion from "../hocs/withVersion";

const Footer = ({
  id,
  version,
  fetchTypes,
  hidden,
  taxonomy,
  apiStatus,
  selectPalette,
  levels,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const popupId = open ? "simple-popover" : undefined;
  let options = qs.parse(location.search.replace(/^\?/, ""));
  let currentPalette = options.palette || id;
  const updatePalette = (newPalette) => {
    if (newPalette != currentPalette) {
      options.palette = newPalette;
    }
    if (options.palette == "default") {
      delete options.palette;
    }
    handleClose();
    navigate(`${location.pathname}?${qs.stringify(options)}${location.hash}`);
  };
  useEffect(() => {
    fetchTypes("multi", options.taxonomy || taxonomy);
  }, [taxonomy, apiStatus]);
  useEffect(() => {
    if (currentPalette != id) {
      selectPalette(currentPalette);
    }
  }, [currentPalette, levels]);
  if (!taxonomy || hidden) {
    return <Taxonomy display={false} />;
  }

  let dataRelease;

  if (version.hub) {
    let releaseLink = version.release;
    if (version.source) {
      releaseLink = (
        <a className={styles.link} href={version.source} target="_blank">
          {releaseLink}
        </a>
      );
    }
    dataRelease = (
      <span style={{ float: "left", marginLeft: "1em" }}>
        {version.hub} data release {releaseLink}
      </span>
    );
  }
  let colors =
    levels.default.length > 6
      ? levels[6] || levels.default.slice(0, 6)
      : levels.default.slice(0, 6);
  let palette = <PalettePreview colors={colors} size="2em" />;

  let settingsPopup = (
    <Popover
      id={popupId}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
    >
      <PalettePicker handleClick={updatePalette} />
    </Popover>
  );

  let reportIssue = (
    <span style={{ float: "right", marginRight: "1em" }}>
      Report an{" "}
      <a
        className={styles.link}
        href="https://github.com/genomehubs/genomehubs/issues"
        target="_blank"
      >
        issue
      </a>
    </span>
  );

  let poweredBy = (
    // <span style={{ float: "left", marginLeft: "1em" }}>
    <span>
      Powered by{" "}
      <a className={styles.link} href="https://genomehubs.org/" target="_blank">
        GenomeHubs
      </a>{" "}
      <CopyrightIcon fontSize="inherit" /> {new Date().getFullYear()}
    </span>
  );

  let settings = (
    <span
      style={{ float: "left", marginLeft: "1em", cursor: "pointer" }}
      onClick={handleClick}
    >
      {palette}
    </span>
  );

  let logos = (
    <span style={{ float: "right", marginRight: "0.5em" }}>
      <a href="https://www.sanger.ac.uk/" target="_blank">
        <img src={sangerLogo} />
      </a>
      <a href="https://www.darwintreeoflife.org" target="_blank">
        <img src={dtolLogo} />
      </a>
      <a href="https://bbsrc.ukri.org/" target="_blank">
        <img src={bbsrcLogo} />
      </a>
    </span>
  );

  return (
    <footer>
      <Taxonomy display={false} />
      <Grid container direction="row" spacing={0} style={{ maxHeight: "100%" }}>
        <Grid item xs={3}>
          {dataRelease}
        </Grid>
        <Grid item xs={6}></Grid>
        <Grid item xs={3}>
          {reportIssue}
        </Grid>
      </Grid>
      <Grid container direction="row" spacing={0} style={{ maxHeight: "100%" }}>
        <Grid item xs={4}>
          {settings}
          {settingsPopup}
        </Grid>
        <Grid item xs={4}>
          {poweredBy}
        </Grid>
        <Grid item xs={4}>
          {logos}
        </Grid>
      </Grid>
    </footer>
  );
};

export default compose(
  memo,
  dispatchRecord,
  withVersion,
  withApi,
  withTaxonomy,
  dispatchTypes,
  withColors
)(Footer);
