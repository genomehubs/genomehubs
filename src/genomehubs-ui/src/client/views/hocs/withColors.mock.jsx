import {
  getAllPalettes,
  getColorScheme,
  getDefaultPalette,
  getStatusColors,
  selectPalette,
  setColorScheme,
} from "#reducers/color";

import React from "react";
import { connect } from "react-redux";
import { fn } from "@storybook/test";

const mockWithColors = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => {
    let { id, colors, levels } = getDefaultPalette(state);
    return {
      id,
      colors,
      levels,
      statusColors: getStatusColors(state),
      palettes: getAllPalettes(state),
      colorScheme: getColorScheme(state),
    };
  };

  const mapDispatchToProps = (dispatch) => ({
    selectPalette: (id) => {
      dispatch(selectPalette(id));
    },
    selectColorScheme: (scheme) => {
      dispatch(setColorScheme(scheme));
    },
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export const withColors = fn(mockWithColors).mockName("withColors");

export default withColors;
