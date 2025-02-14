import { PalettePreview } from "./PalettePreview";

const meta = {
  component: PalettePreview,
  tags: ["autodocs"],
};

/**
 * PalettePreview stories
 * These stories showcase the PalettePreview component.
 */
export default meta;

export const Default = {
  args: {
    // six colours from the viridis color palette
    colors: ["#440154", "#414487", "#2A788E", "#22A884", "#7AD151", "#FDE725"],
  },
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};

export const FiveColors = {
  args: {
    // five colours from the brewer paired palette
    colors: ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "#FB9A99"],
  },
};

export const FourColors = {
  args: {
    // four colours from the color universal design palette
    colors: ["#E69F00", "#56B4E9", "#009E73", "#F0E442"],
  },
};

export const SevenColors = {
  args: {
    // seven colours from the colorbrewer paired palette
    colors: [
      "#A6CEE3",
      "#1F78B4",
      "#B2DF8A",
      "#33A02C",
      "#FB9A99",
      "#E31A1C",
      "#FDBF6F",
    ],
  },
};

export const Small = {
  args: {
    ...Default.args,
    size: "1em",
  },
};

export const Large = {
  args: {
    ...Default.args,
    size: "3em",
  },
};

export const SoftEdge = {
  args: {
    ...Default.args,
    borderRadius: "15%",
  },
};

export const Rounded = {
  args: {
    ...Default.args,
    borderRadius: "50%",
  },
};

export const Spaced = {
  args: {
    ...Default.args,
    margin: "0.1em",
  },
};

export const RoundedSpaced = {
  args: {
    ...Default.args,
    borderRadius: Rounded.args.borderRadius,
    margin: Spaced.args.margin,
  },
};

export const Tooltip = {
  args: {
    ...Default.args,
    showTooltip: true,
  },
};

export const Narrow = {
  args: {
    ...Default.args,
    swatches: 4,
  },
};

export const Wide = {
  args: {
    ...Default.args,
    swatches: 8,
  },
};
