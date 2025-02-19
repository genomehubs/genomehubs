import React, { memo, useEffect, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
//   createTheme,
//   makeStyles,
// } from "@material-ui/core/styles";
import { app as appStyle, infoPanel as infoPanelStyle } from "./Styles.scss";

import CssBaseline from "@mui/material/CssBaseline";
import Head from "./Head";
import Layout from "./Layout";
import LoadingScreen from "./LoadingScreen";
import ReactErrorBoundary from "./ReactErrorBoundary";
import StylesProvider from "@mui/styles/StylesProvider";
import classnames from "classnames";
import { compose } from "recompose";
import withColors from "../hocs/withColors";
import { withCookies } from "react-cookie";
import withLoading from "../hocs/withLoading";
import withTheme from "../hocs/withTheme";

const App = ({ theme = "dark", cookies, loading, colorScheme }) => {
  const backgroundColor = colorScheme[theme].lightColor;
  const muiTheme = createTheme({
    palette: {
      mode: theme,
      background: { default: backgroundColor, paper: backgroundColor },
    },
  });
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
        <CssBaseline />
        <StylesProvider injectFirst>
          <div style={{ position: "relative", height: "100%", width: "100%" }}>
            <div className={classnames(`theme-${theme}`, appStyle)}>
              <div id="wrapper" className="">
                <div
                  id="theme-base"
                  className={infoPanelStyle}
                  style={{ margin: 0 }}
                />
                <ReactErrorBoundary>
                  <>
                    <Head />
                    <LoadingScreen />

                    <Layout />
                  </>
                </ReactErrorBoundary>
              </div>
            </div>
          </div>
        </StylesProvider>
      </ThemeProvider>,
    );
  }, [theme, cookies, loading]);
  return content;
};

export default compose(
  memo,
  withTheme,
  withColors,
  withCookies,
  withLoading,
)(App);
