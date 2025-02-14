import * as PalettePreviewStories from "./PalettePreview.stories";

import PalettePicker from "./PalettePicker";

const meta = {
  component: PalettePicker,
  // title: "PalettePicker",
  // decorators: [(story) => <div style={{ margin: "3rem" }}>{story()}</div>],
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
