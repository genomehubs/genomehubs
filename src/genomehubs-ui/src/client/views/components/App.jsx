import React, { memo, useEffect, useState } from "react";
import {
  ThemeProvider,
  createTheme,
  makeStyles,
} from "@material-ui/core/styles";
import { app as appStyle, infoPanel as infoPanelStyle } from "./Styles.scss";

import { CookiesProvider } from "react-cookie";
import Head from "./Head";
import Layout from "./Layout";
import LoadingScreen from "./LoadingScreen";
import ReactErrorBoundary from "./ReactErrorBoundary";
import StylesProvider from "@mui/styles/StylesProvider";
import classnames from "classnames";
import { compose } from "recompose";
import { withCookies } from "react-cookie";
import withLoading from "../hocs/withLoading";
// import withFadeInOut from "../hocs/withFadeInOut";
import withTheme from "../hocs/withTheme";

const muiTheme = createTheme();

const useStyles = makeStyles((theme) => {
  root: {
    // some css that access to theme
  }
});

const App = ({ theme, cookies, loading }) => {
  let tracking;
  if (cookies.get("cookieConsent") == "all") {
    tracking = <script src="/zxtm/piwik2.js"></script>;
  }
  const [content, setContent] = useState(null);
  useEffect(() => {
    if (loading == "finished") {
      return;
    }
    setContent(
      <ThemeProvider theme={muiTheme}>
        <StylesProvider injectFirst>
          <div style={{ position: "relative", height: "100%", width: "100%" }}>
            <div
              className={classnames(`theme${theme}`, appStyle)}
              // style={{ overflow: loading ? "hidden" : "visible" }}
            >
              <div id="theme-base" className={infoPanelStyle} />
              <ReactErrorBoundary>
                <>
                  <Head />
                  {/* <CookiesProvider>
          <Layout cookies={cookies} />
        </CookiesProvider> */}
                  <LoadingScreen />

                  <Layout />
                </>
              </ReactErrorBoundary>
            </div>
          </div>
        </StylesProvider>
      </ThemeProvider>
    );
  }, [theme, cookies, loading]);
  return content;
};

export default compose(memo, withTheme, withCookies, withLoading)(App);
