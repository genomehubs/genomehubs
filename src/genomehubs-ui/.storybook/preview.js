import "@fontsource/open-sans/index.css";
import "@fontsource/open-sans/700.css";
import "@fontsource/open-sans/400-italic.css";
import "@fontsource/open-sans/700-italic.css";
import "@fontsource/signika/index.css";
// import "@fontsource/signika/700.css";
import "@fontsource/roboto/index.css";
import "@fontsource/roboto-mono/index.css";
import "@fontsource/roboto-mono/700.css";
import "@fontsource/roboto-mono/400-italic.css";
import "@fontsource/roboto-mono/700-italic.css";

import { ThemeProvider, createTheme } from "@mui/material/styles";

/** @type { import('@storybook/react-webpack5').Preview } */
import StylesProvider from "@mui/styles/StylesProvider";

const theme = "lightTheme";
const lightTheme = createTheme({
  palette: {
    mode: "light",
  },
});
const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

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
        background: theme === "darkTheme" ? `${darkColor}` : `${lightColor}`,
        color: theme === "darkTheme" ? `${lightColor}` : `${darkColor}`,
        fontFamily: "Open Sans, sans-serif",
      }}
    >
      {children}
    </div>
  );
};

const withStoryTheme = (Story, theme) => {
  return <Story theme={theme} />;
};

const ThemeWrapper = ({ theme, left, fill, children }) => {
  const muiTheme = theme === "lightTheme" ? lightTheme : darkTheme;
  return (
    <ThemeProvider theme={muiTheme}>
      <StylesProvider injectFirst>
        <ThemeBlock left={left} fill={fill} theme={theme}>
          <div className={`theme-${theme}`}>{children}</div>
        </ThemeBlock>
      </StylesProvider>
    </ThemeProvider>
  );
};

export const withTheme = (story, context) => {
  // Get values from story parameter first, else fallback to globals
  const theme =
    context.parameters.theme || context.globals.theme || "lightTheme";
  const muiTheme = theme === "lightTheme" ? lightTheme : darkTheme;
  const storyTheme = theme;
  //   return <div className={storyTheme}>{Story()}</div>;

  switch (theme) {
    case "side-by-side": {
      return (
        <>
          <ThemeWrapper theme="lightTheme" left>
            {withStoryTheme(story, "lightTheme")}
          </ThemeWrapper>
          <ThemeWrapper theme="darkTheme">
            {withStoryTheme(story, "darkTheme")}
          </ThemeWrapper>
        </>
      );
    }
    default: {
      return (
        <ThemeWrapper theme={theme} fill>
          {withStoryTheme(story, theme)}
        </ThemeWrapper>
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

  decorators: [withTheme],

  globalTypes: {
    theme: {
      description: "Global theme for components",
      toolbar: {
        // The label to show for this toolbar item
        title: "Theme",
        // icon: "circlehollow",
        // Array of plain string values or MenuItem shape (see below)
        items: [
          { value: "lightTheme", icon: "circlehollow", title: "light" },
          { value: "darkTheme", icon: "circle", title: "dark" },
          { value: "side-by-side", icon: "sidebar", title: "side by side" },
        ],
        // Change title based on selected value
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: "lightTheme",
  },

  tags: ["autodocs"],
};

export default preview;
