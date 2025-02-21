import {
  getAllPalettes,
  getColorScheme,
  getDefaultPalette,
  getStatusColors,
  selectPalette,
} from "../reducers/color";

import React from "react";
import { connect } from "react-redux";

export const withColors = (WrappedComponent) => (props) => {
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
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withColors;
