import React, { Suspense, lazy, memo, useEffect, useState } from "react";

import CookieBanner from "./CookieBanner";
import DownloadMessage from "./DownloadMessage";
import Grid from "@mui/material/Grid";
import Header from "./Header";
import Main from "./Main";
import { Router } from "@reach/router";
import { compose } from "redux";
import { fillParent as fillParentStyle } from "./Styles.scss";
import makeStyles from "@mui/styles/makeStyles";
import withSiteName from "#hocs/withSiteName";

const Footer = lazy(() => import("./Footer"));

const useStyles = makeStyles((theme) => ({
  container: {
    minHeight: "100vh",
    minWidth: "900px",
    maxWidth: "100%",
    overflowX: "hidden",
  },
  item: {
    minWidth: "100% !important",
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
        <Grid className={classes.item}>
          <CookieBanner />
        </Grid>
        <Grid className={classes.item} style={{ zIndex: 1000 }}>
          <Header id="header" />
        </Grid>
        <Grid className={classes.item} id="mainContainer">
          {/* {types && Object.keys(types).length > 0 && ( */}

          <Main />
          <DownloadMessage />

          {/* )} */}
        </Grid>
        <Grid className={classes.item}>
          <Suspense fallback={<div style={{ minHeight: "100px" }} />}>
            <Footer />
          </Suspense>
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
      <Suspense fallback={<div style={{ minHeight: "100px" }} />}>
        <Footer hidden />
      </Suspense>
    </div>
  );
};

const SearchLayout = (props) => {
  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <CookieBanner />
      <SearchPage topLevel {...props} />
      <Suspense fallback={<div style={{ minHeight: "100px" }} />}>
        <Footer hidden />
      </Suspense>
    </div>
  );
};

const Layout = ({ types, basename, loading }) => {
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
  return (
    <>
      <Router className={fillParentStyle} basepath={basename} primary={false}>
        {paths}
      </Router>
    </>
  );
};

export default compose(memo, withSiteName)(Layout);
