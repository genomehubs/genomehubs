import React from "react";
/** @type { import('@storybook/react').Preview } */
import StylesProvider from "@mui/styles/StylesProvider";
import { ThemeProvider } from "@mui/styles";
import { createTheme } from "@mui/material/styles";
import withTheme from "../hocs/withTheme";

const theme = "light";
const muiTheme = createTheme();

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
    (story) => (
      <ThemeProvider theme={muiTheme}>
        <StylesProvider injectFirst>
          <div className={`theme${theme}`}>{story()}</div>
        </StylesProvider>
      </ThemeProvider>
    ),
  ],
};

export default preview;
