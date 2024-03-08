import React, { memo, useEffect, useState } from "react";

import { CookiesProvider } from "react-cookie";
import Head from "./Head";
import Layout from "./Layout";
import ReactErrorBoundary from "./ReactErrorBoundary";
import { StylesProvider } from "@material-ui/core/styles";
import classnames from "classnames";
import { compose } from "recompose";
import styles from "./Styles.scss";
import { withCookies } from "react-cookie";
// import withFadeInOut from "../hocs/withFadeInOut";
import withTheme from "../hocs/withTheme";

const App = ({ theme, cookies }) => {
  let tracking;
  if (cookies.get("cookieConsent") == "all") {
    tracking = <script src="/zxtm/piwik2.js"></script>;
  }
  const [content, setContent] = useState(null);
  useEffect(() => {
    setContent(
      <StylesProvider injectFirst>
        <div style={{ position: "relative" }}>
          <div className={classnames(`theme${theme}`, styles.app)}>
            <div id="theme-base" className={styles.infoPanel} />
            <ReactErrorBoundary>
              <>
                <Head />
                {/* <CookiesProvider>
          <Layout cookies={cookies} />
        </CookiesProvider> */}
                <Layout />
              </>
            </ReactErrorBoundary>
          </div>
        </div>
      </StylesProvider>
    );
  }, [theme, cookies]);
  return content;
};

export default compose(memo, withTheme, withCookies)(App);
