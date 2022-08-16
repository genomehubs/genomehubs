import {
  ancestralColor,
  descendantColor,
  descendantHighlight,
  directColor,
  directHighlight,
  getDefaultPalette,
} from "../reducers/color";

import React from "react";
import { connect } from "react-redux";

const COLORS = [
  "#1f78b4",
  "#a6cee3",
  "#33a02c",
  "#b2df8a",
  "#e31a1c",
  "#fb9a99",
  "#ff7f00",
  "#fdbf6f",
  "#6a3d9a",
  "#cab2d6",
];

const withColors = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => {
    let { id, colors, levels } = getDefaultPalette(state);
    return {
      id,
      colors,
      levels,
      statusColors: {
        ancestral: ancestralColor,
        descendant: descendantColor,
        direct: directColor,
        descendantHighlight,
        directHighlight,
      },
    };
  };

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withColors;
