import * as PalettePreviewStories from "./PalettePreview.stories";

import PalettePicker from "./PalettePicker";
import { Provider } from "react-redux";
import React from "react";
import colorStore from "../reducers/color.store";

const meta = {
  component: PalettePicker,
  // title: "PalettePicker",
  decorators: [(story) => <Provider store={colorStore}>{story()}</Provider>],
  tags: ["autodocs"],
  // excludeStories: /.*MockedState$/,
};

export default meta;

export const Default = {
  args: {
    swatches: 6,
  },
};

export const Wide = {
  args: {
    swatches: 10,
  },
};

export const Narrow = {
  args: {
    swatches: 3,
  },
};

export const Auto = {
  args: {
    swatches: undefined,
  },
};

export const SoftEdge = {
  args: {
    ...PalettePreviewStories.SoftEdge.args,
    ...Default.args,
  },
};

export const Rounded = {
  args: {
    ...PalettePreviewStories.Rounded.args,
    ...Default.args,
  },
};

export const Spaced = {
  args: {
    ...PalettePreviewStories.Spaced.args,
    ...Default.args,
  },
};

export const RoundedSpaced = {
  args: {
    ...PalettePreviewStories.RoundedSpaced.args,
    ...Default.args,
  },
};

export const Tooltip = {
  args: {
    ...PalettePreviewStories.Tooltip.args,
    ...Default.args,
  },
};
