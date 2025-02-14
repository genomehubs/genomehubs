import React from "react";
import { defaultPalettes } from "../reducers/color";
import { fn } from "@storybook/test";
import { interpolateViridis } from "d3-scale-chromatic";

const mockWithColors = (WrappedComponent) => (props) => {
  // let palette = createD3Palette(interpolateViridis, 50);
  const newProps = {
    ...props,
    id: "default",
    colors: defaultPalettes.byId.default,
    levels: defaultPalettes.byId.default.levels,
    statusColors: {},
    palettes: defaultPalettes,
    selectPalette: (id) => {},
  };

  return <WrappedComponent {...newProps} />;
};

export const withColors = fn(mockWithColors).mockName("withColors");

export default withColors;
