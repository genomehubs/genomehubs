const chipPalettes = {
  blue: {
    darkColor: "#185b89",
    lightColor: "#a6cee3",
    backgroundColor: "#1f78b4",
    textColor: "#ffffff",
  },
  green: {
    darkColor: "#277821",
    lightColor: "#b2df8a",
    backgroundColor: "#33a02c",
    textColor: "#ffffff",
  },
  red: {
    darkColor: "#b51517",
    lightColor: "#fb9a99",
    backgroundColor: "#e31a1c",
    textColor: "#ffffff",
  },
  orange: {
    darkColor: "#cc6600",
    lightColor: "#fdbf6f",
    backgroundColor: "#ff7f00",
    textColor: "#ffffff",
  },
  purple: {
    darkColor: "#512f76",
    lightColor: "#cab2d6",
    backgroundColor: "#6a3d9a",
    textColor: "#ffffff",
  },
  yellow: {
    darkColor: "#87431f",
    lightColor: "#ffff99",
    backgroundColor: "#b15928",
    textColor: "#000000",
  },
  grey: {
    darkColor: "#636363",
    lightColor: "#bdbdbd",
    backgroundColor: "#969696",
    textColor: "#ffffff",
  },
  black: {
    darkColor: "#000000",
    lightColor: "#bdbdbd",
    backgroundColor: "#000000",
    textColor: "#ffffff",
  },
  white: {
    darkColor: "#ffffff",
    lightColor: "#bdbdbd",
    backgroundColor: "#ffffff",
    textColor: "#000000",
  },
};

export const getChipPalette = (palette) => {
  if (typeof palette === "string") {
    return chipPalettes[palette] || chipPalettes.blue; // Default to blue if not found
  }
  return palette; // Return the palette object directly if it's not a string
};

export const getChipColor = (palette, variant) => {
  const chipPalette = getChipPalette(palette);
  if (chipPalette) {
    return chipPalette[variant] || chipPalette.backgroundColor; // Default to backgroundColor if variant not found
  }
  return chipPalettes.blue[variant] || chipPalettes.blue.backgroundColor; // Default to blue if not found
};
