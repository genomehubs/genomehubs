import React, { memo, useEffect } from "react";

import CopyrightIcon from "@material-ui/icons/Copyright";
import Grid from "@material-ui/core/Grid";
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
import withTaxonomy from "../hocs/withTaxonomy";
import withVersion from "../hocs/withVersion";

const Footer = ({ version, fetchTypes, hidden, taxonomy, apiStatus }) => {
  let options = qs.parse(location.search.replace(/^\?/, ""));
  useEffect(() => {
    fetchTypes("multi", options.taxonomy || taxonomy);
  }, [taxonomy, apiStatus]);
  if (hidden) {
    return null;
  }

  let dataRelease;

  if (version.hub) {
    let releaseLink = `release ${version.release}`;
    if (version.source) {
      releaseLink = (
        <a className={styles.link} href={version.source} target="_blank">
          {releaseLink}
        </a>
      );
    }
    dataRelease = (
      <span style={{ float: "left", marginLeft: "1em" }}>
        {version.hub} data {releaseLink}
      </span>
    );
  }

  return (
    <footer>
      <Taxonomy display={false} />
      <Grid container direction="row" spacing={0} style={{ maxHeight: "100%" }}>
        <Grid item xs={3}>
          {dataRelease}
        </Grid>
        <Grid item xs={6}>
          <a href="https://www.sanger.ac.uk/" target="_blank">
            <img src={sangerLogo} />
          </a>
          <a href="https://www.darwintreeoflife.org" target="_blank">
            <img src={dtolLogo} />
          </a>
          <a href="https://bbsrc.ukri.org/" target="_blank">
            <img src={bbsrcLogo} />
          </a>
        </Grid>
        <Grid item xs={3}>
          <span style={{ float: "right", marginRight: "1em" }}>
            Powered by{" "}
            <a
              className={styles.link}
              href="https://genomehubs.org/"
              target="_blank"
            >
              GenomeHubs
            </a>{" "}
            <CopyrightIcon fontSize="inherit" /> {new Date().getFullYear()}
          </span>
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
  dispatchTypes
)(Footer);
