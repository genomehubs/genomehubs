import {
  darkThemeColors,
  getTheme,
  lightThemeColors,
  setColorScheme,
  setTheme,
} from "../reducers/color";

import React from "react";
import { connect } from "react-redux";
import { fn } from "@storybook/test";

const mockWithTheme = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    // theme: getTheme(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setTheme: (theme) => {
      dispatch(setTheme(theme));
      dispatch(
        setColorScheme(theme === "light" ? lightThemeColors : darkThemeColors),
      );
    },
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export const withTheme = fn(mockWithTheme).mockName("withTheme");

export default withTheme;
