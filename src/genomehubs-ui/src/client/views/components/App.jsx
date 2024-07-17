import React, { memo, useEffect, useState } from "react";

import { CookiesProvider } from "react-cookie";
import Head from "./Head";
import Layout from "./Layout";
import LoadingScreen from "./LoadingScreen";
import ReactErrorBoundary from "./ReactErrorBoundary";
import { StylesProvider } from "@material-ui/core/styles";
import classnames from "classnames";
import { compose } from "recompose";
import styles from "./Styles.scss";
import { withCookies } from "react-cookie";
import withLoading from "../hocs/withLoading";
// import withFadeInOut from "../hocs/withFadeInOut";
import withTheme from "../hocs/withTheme";

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
      <StylesProvider injectFirst>
        <div style={{ position: "relative", height: "100%", width: "100%" }}>
          <div
            className={classnames(`theme${theme}`, styles.app)}
            style={{ overflow: loading ? "hidden" : "visible" }}
          >
            <div id="theme-base" className={styles.infoPanel} />
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
    );
  }, [theme, cookies, loading]);
  return content;
};

export default compose(memo, withTheme, withCookies, withLoading)(App);
