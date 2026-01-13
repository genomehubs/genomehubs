import * as PalettePreviewStories from "./PalettePreview.stories";

import PalettePicker from "./PalettePicker";
import { Provider } from "react-redux";
import React from "react";
import colorStore from "#reducers/color.store";
import { themeFromContext } from "#storybook/functions/themeFromContext";

const meta = {
  component: PalettePicker,
  // title: "PalettePicker",
  decorators: [(story) => <Provider store={colorStore}>{story()}</Provider>],
  tags: ["autodocs"],
  // excludeStories: /.*MockedState$/,
  args: {
    swatches: 6,
    theme: "lightTheme",
  },
};

export default meta;

export const Default = (inputArgs, context) => (
  <PalettePicker {...inputArgs} theme={themeFromContext(context)} />
);

export const Wide = (inputArgs, context) => {
  let args = { ...inputArgs, swatches: 10, theme: themeFromContext(context) };
  return <PalettePicker {...args} />;
};

export const Narrow = (inputArgs, context) => {
  let args = { ...inputArgs, swatches: 3, theme: themeFromContext(context) };
  return <PalettePicker {...args} />;
};

export const Auto = (inputArgs, context) => {
  let args = {
    ...inputArgs,
    swatches: undefined,
    theme: themeFromContext(context),
  };
  return <PalettePicker {...args} />;
};

export const SoftEdge = (inputArgs, context) => {
  let args = {
    ...PalettePreviewStories.SoftEdge.args,
    ...inputArgs,
    theme: themeFromContext(context),
  };
  return <PalettePicker {...args} />;
};

export const Rounded = (inputArgs, context) => {
  let args = {
    ...PalettePreviewStories.Rounded.args,
    ...inputArgs,
    theme: themeFromContext(context),
  };
  return <PalettePicker {...args} />;
};

export const Spaced = (inputArgs, context) => {
  let args = {
    ...PalettePreviewStories.Spaced.args,
    ...inputArgs,
    theme: themeFromContext(context),
  };
  return <PalettePicker {...args} />;
};

export const RoundedSpaced = (inputArgs, context) => {
  let args = {
    ...PalettePreviewStories.RoundedSpaced.args,
    ...inputArgs,
    theme: themeFromContext(context),
  };
  return <PalettePicker {...args} />;
};

export const Tooltip = (inputArgs, context) => {
  let args = {
    ...PalettePreviewStories.Tooltip.args,
    ...inputArgs,
    theme: themeFromContext(context),
  };
  return <PalettePicker {...args} />;
};
