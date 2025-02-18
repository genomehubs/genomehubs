import React from "react";
/** @type { import('@storybook/react').Preview } */
import StylesProvider from "@mui/styles/StylesProvider";
import { ThemeProvider } from "@mui/styles";
import { createTheme } from "@mui/material/styles";
import { themes } from "@storybook/theming";
import withTheme from "../hocs/withTheme";
import { withThemeByClassName } from "@storybook/addon-themes";
import { withThemeFromJSXProvider } from "@storybook/addon-themes";
import { withThemes } from "storybook-addon-themes/react";
import { withThemesProvider } from "storybook-addon-styled-component-theme";
const theme = "light";
const lightTheme = createTheme();
const darkTheme = createTheme();

const ThemeBlock = ({ left, fill, theme, children }) => {
  const lightColor = "#ffffff";
  const darkColor = "#31323f";
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: left || fill ? 0 : "50vw",
        borderRight: left ? `1px solid ${darkColor}` : "none",
        right: left ? "50vw" : 0,
        width: fill ? "100vw" : "50vw",
        height: "100vh",
        bottom: 0,
        overflow: "auto",
        padding: "1rem",
        background: theme === "dark" ? `${darkColor}` : `${lightColor}`,
        // [breakpoints.S]: {
        //   left: left ? 0 : "50vw",
        //   right: left ? "50vw" : 0,
        //   padding: "0 !important",
        // },
      }}
    >
      {children}
    </div>
  );
};

const ThemeWrapper = ({ theme, children, ...props }) => {
  const muiTheme = theme === "light" ? lightTheme : darkTheme;
  return <div className="themelight">{children}</div>;
};

export const withTheme = (story, context) => {
  // Get values from story parameter first, else fallback to globals
  const theme = context.parameters.theme || context.globals.theme;
  const muiTheme = theme === "light" ? lightTheme : darkTheme;
  const storyTheme = theme === "dark" ? "themedark" : "themelight";
  //   return <div className={storyTheme}>{Story()}</div>;

  const withLightTheme = (Story) => {
    return <Story theme={"light"} />;
  };

  const withDarkTheme = (Story) => {
    return <Story theme={"dark"} />;
  };

  switch (theme) {
    case "side-by-side": {
      return (
        <>
          {/* <ThemeProvider theme={lightTheme}>
            <StylesProvider injectFirst> */}
          <ThemeBlock left>
            <ThemeWrapper theme="light">{withLightTheme(story)}</ThemeWrapper>
          </ThemeBlock>
          {/* </StylesProvider>
          </ThemeProvider> */}
          {/* <ThemeProvider theme={darkTheme}>
            <StylesProvider injectFirst> */}
          <ThemeBlock theme="dark">
            <div className="themedark">{withDarkTheme(story)}</div>
          </ThemeBlock>
          {/* </StylesProvider>
          </ThemeProvider> */}
        </>
      );
    }
    default: {
      return (
        // <ThemeProvider theme={muiTheme}>
        //   <StylesProvider injectFirst>
        <ThemeBlock fill theme={theme}>
          <div className="themedark">{story()}</div>
        </ThemeBlock>
        //   </StylesProvider>
        // </ThemeProvider>
      );
    }
  }
};

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    withTheme,
    // withThemeByClassName({
    //   themes: {
    //     light: "themelight",
    //     dark: "themedark",
    //   },
    //   defaultTheme: theme,
    // }),
    // withThemeFromJSXProvider({
    //   themes: {
    //     light: themes.light,
    //     dark: themes.dark,
    //   },
    //   defaultTheme: theme,
    // }),
    // (Story, context) => {
    //   // Get the active theme value from the story parameter
    //   const { theme } = context.parameters;
    //   const storyTheme = theme === "dark" ? "themedark" : "themelight";
    //   return <div className={storyTheme}>{Story()}</div>;
    // },
  ],
  globalTypes: {
    theme: {
      description: "Global theme for components",
      toolbar: {
        // The label to show for this toolbar item
        title: "Theme",
        // icon: "circlehollow",
        // Array of plain string values or MenuItem shape (see below)
        items: [
          { value: "light", icon: "circlehollow", title: "light" },
          { value: "dark", icon: "circle", title: "dark" },
          { value: "side-by-side", icon: "sidebar", title: "side by side" },
        ],
        // Change title based on selected value
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
};

export default preview;
