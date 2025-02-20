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

const App = ({ theme = "dark", setTheme, cookies, loading, colorScheme }) => {
  const backgroundColor = colorScheme[theme].lightColor;
  console.log("colorScheme", colorScheme);
  const muiTheme = createTheme({
    palette: {
      mode: theme,
      background: { default: backgroundColor, paper: backgroundColor },
      // button color
      button: {
        // main: colorScheme[theme].darkColor,
        // light: colorScheme[theme].darkColor,
        // dark: colorScheme[theme].darkColor,
        // primary: colorScheme[theme].darkColor,
        // hover: colorScheme[theme].deepColor,
        // contrastText: colorScheme[theme].lightColor,

        main: colorScheme[theme].paleColor,
        light: colorScheme[theme].paleColor,
        dark: colorScheme[theme].paleColor,
        primary: colorScheme[theme].paleColor,
        hover: colorScheme[theme].hoverColor,
        contrastText: colorScheme[theme].darkColor,
      },
    },
    components: {
      MuiSwitch: {
        styleOverrides: {
          MuiFormControlLabel: {
            styleOverrides: {
              label: {
                color: colorScheme[theme].darkColor,
              },
            },
          },
        },
      },
    },
  });
  let tracking;
  if (cookies.get("cookieConsent") == "all") {
    tracking = <script src="/zxtm/piwik2.js"></script>;
  }
  const [content, setContent] = useState(null);
  useEffect(() => {
    // add event listenerr to detect changes in preferred color scheme
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", (evt) =>
      setTheme(evt.matches ? "dark" : "light"),
    );
  }, []);

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
