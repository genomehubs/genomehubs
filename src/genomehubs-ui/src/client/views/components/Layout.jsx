import React, { memo, useEffect, useState } from "react";

import CookieBanner from "./CookieBanner";
import DownloadMessage from "./DownloadMessage";
import Footer from "./Footer";
import Grid from "@material-ui/core/Grid";
import Header from "./Header";
import Main from "./Main";
import ReportPage from "./ReportPage";
import { Router } from "@reach/router";
import SearchPage from "./SearchPage";
import classnames from "classnames";
import { compose } from "recompose";
import loadable from "@loadable/component";
import { makeStyles } from "@material-ui/core/styles";
import styles from "./Styles.scss";
import withSiteName from "../hocs/withSiteName";
import withTypes from "../hocs/withTypes";

// const ReportPage = loadable(() => import("./ReportPage"));

const useStyles = makeStyles((theme) => ({
  container: {
    minHeight: "100vh",
    minWidth: "900px",
    maxWidth: "100%",
    overflowX: "hidden",
  },
  item: {
    minWidth: "100%",
    maxWidth: "100%",
  },
  footer: {
    minWidth: "100%",
    maxWidth: "100%",
  },
}));

const DefaultLayout = ({}) => {
  const classes = useStyles();
  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <Grid
        container
        className={classes.container}
        spacing={0}
        direction="column"
      >
        <Grid item className={classes.item} xs={1}>
          <CookieBanner />
        </Grid>
        <Grid item className={classes.item} xs={1} style={{ zIndex: 1000 }}>
          <Header />
        </Grid>
        <Grid item className={classes.item} xs={true}>
          {/* {types && Object.keys(types).length > 0 && ( */}

          <Main />
          <DownloadMessage />

          {/* )} */}
        </Grid>
        <Grid item className={classes.item} xs={1}>
          <Footer />
        </Grid>
      </Grid>
    </div>
  );
};

const ReportLayout = (props) => {
  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <CookieBanner />
      <div>
        <ReportPage topLevel {...props} />
      </div>
      <Footer hidden />
    </div>
  );
};

const SearchLayout = (props) => {
  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <CookieBanner />
      <SearchPage topLevel {...props} />
      <Footer hidden />
    </div>
  );
};

const Layout = ({ types, basename }) => {
  const [paths, setPaths] = useState([]);
  // let typeString = JSON.stringify(types);
  // console.log(typeString);
  useEffect(() => {
    setPaths([
      <DefaultLayout path="/*" key={0} types={{}} />,
      <ReportLayout path="/reporturl" key={1} />,
      <SearchLayout path="/searchurl" key={2} />,
    ]);
  }, []);
  console.log("layout");
  return (
    <>
      <Router className={styles.fillParent} basepath={basename} primary={false}>
        {paths}
      </Router>
    </>
  );
};

export default compose(memo, withSiteName)(Layout);
