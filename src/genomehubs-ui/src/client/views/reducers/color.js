import { createAction, handleAction, handleActions } from "redux-actions";
import { createD3Palette, createPalette } from "./color/createPalette";
import {
  interpolateCividis,
  interpolateCool,
  interpolateCubehelixDefault,
  interpolateInferno,
  interpolateMagma,
  interpolatePlasma,
  interpolateTurbo,
  interpolateViridis,
  interpolateWarm,
  schemeAccent,
  schemeCategory10,
  schemeDark2,
  schemePaired,
  schemeTableau10,
} from "d3-scale-chromatic";

import batlow from "./color/batlow";
import batlowS from "./color/batlowS";
import { createSelector } from "reselect";
import immutableUpdate from "immutable-update";

const ANCESTRAL_COLOR =
  typeof ANCESTRAL_COLOR !== "undefined" ? ANCESTRAL_COLOR : "#db4325";
const DESCENDANT_COLOR =
  typeof DESCENDANT_COLOR !== "undefined" ? DESCENDANT_COLOR : "#eda247";
const DIRECT_COLOR =
  typeof DIRECT_COLOR !== "undefined" ? DIRECT_COLOR : "#006164";
const DESCENDANT_HIGHLIGHT =
  typeof DESCENDANT_HIGHLIGHT !== "undefined"
    ? DESCENDANT_HIGHLIGHT
    : "#e6e1bc";
const DIRECT_HIGHLIGHT =
  typeof DIRECT_HIGHLIGHT !== "undefined" ? DIRECT_HIGHLIGHT : "#57c4ad";

export const ancestralColor = ANCESTRAL_COLOR;
export const descendantColor = DESCENDANT_COLOR;
export const directColor = DIRECT_COLOR;
export const descendantHighlight = DESCENDANT_HIGHLIGHT;
export const directHighlight = DIRECT_HIGHLIGHT;

export const addPalette = createAction("ADD_PALETTE");
export const editPalette = createAction("EDIT_PALETTE");

const brewerPalette = [
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
  "#b15928",
  "#ffff99",
];

const bhmPalette = ["#202125", "#bd3829", "#ee8623", "#42632e"];

const pridePalette = [
  "#E50000",
  "#FF8D00",
  "#FFEE00",
  "#028121",
  "#004CFF",
  "#770088",
  "#000000",
  "#613915",
  "#73D7EE",
  "#FFAFC7",
];

const ringsPalette = ["#3e76ec", "#FFCE01", "#000000", "#179A13", "#FF0000"];

const cudPalette = [
  "#000000",
  "#E69F00",
  "#56B4E9",
  "#009E73",
  "#F0E442",
  "#0072B2",
  "#D55E00",
  "#CC79A7",
];

const cudRainbowPalette = [
  "#D55E00", // Red
  "#E69F00", // Orange
  "#F0E442", // Yellow
  "#009E73", // Green
  "#56B4E9", // Blue
  "#0072B2", // Dark Blue
  "#CC79A7", // Pink
  "#000000", // Black
];

export const defaultPalettes = {
  byId: {
    accent: createD3Palette(schemeAccent, 8),
    batlowS: createPalette(batlowS),
    batlow: createPalette(batlow, 50),
    bhm: createPalette(bhmPalette),
    category: createD3Palette(schemeCategory10, 10),
    cividis: createD3Palette(interpolateCividis, 50),
    cool: createD3Palette(interpolateCool, 50),
    cubeHelix: createD3Palette(interpolateCubehelixDefault, 50),
    cud: createPalette(cudPalette),
    cudRainbow: createPalette(cudRainbowPalette),
    dark: createD3Palette(schemeDark2, 8),
    default: createD3Palette(interpolateViridis, 50),
    cudReverse: createPalette(cudPalette.reverse().splice(1)),
    inferno: createD3Palette(interpolateInferno, 50),
    magma: createD3Palette(interpolateMagma, 50),
    paired: createD3Palette(schemePaired, 12),
    plasma: createD3Palette(interpolatePlasma, 50),
    pride: createPalette(pridePalette),
    rings: createPalette(ringsPalette),
    standard: { id: "default", default: brewerPalette, levels: [] },
    tableau: createD3Palette(schemeTableau10, 10),
    turbo: createD3Palette(interpolateTurbo, 50),
    viridis: createD3Palette(interpolateViridis, 50),
    warm: createD3Palette(interpolateWarm, 50),
  },
  allIds: [
    "default",
    "batlow",
    "batlowS",
    "cividis",
    "paired",
    "viridis",
    "cud",
    "cudRainbow",
    "cudReverse",
  ],
};

export const palettes = handleActions(
  {
    ADD_PALETTE: (state, action) =>
      immutableUpdate(state, {
        byId: { [action.payload.id]: action.payload },
        allIds: [...state.allIds, action.payload.id],
      }),
    EDIT_PALETTE: (state, action) => {
      let { id } = action.payload;
      let arr = action.payload[id].slice();
      state.byId[id].forEach((col, i) => {
        if (!arr[i]) {
          arr[i] = col;
        }
      });
      return immutableUpdate(state, {
        byId: {
          [id]: arr,
        },
      });
    },
  },
  defaultPalettes,
);

export const getSelectedPalette = (state) => state.selectedPalette;

export const selectPalette = createAction("SELECT_PALETTE");
export const selectedPalette = handleAction(
  "SELECT_PALETTE",
  (state, action) => action.payload,
  "default",
);

export const getAllPalettes = (state) => state.palettes;

export const getColorPalette = createSelector(
  getSelectedPalette,
  getAllPalettes,
  (id, palettes) => {
    let colors = palettes ? palettes.byId[id] || palettes.byId["default"] : [];
    return { id, colors };
  },
);

export const getUserPalette = createSelector(getAllPalettes, (palettes) => {
  let id = "user";
  let colors = palettes ? palettes.byId[id] || palettes.byId["default"] : [];
  return { id, colors };
});

export const getDefaultPalette = createSelector(
  getSelectedPalette,
  getAllPalettes,
  (id, palettes) => {
    let levels = palettes ? palettes.byId[id] || palettes.byId["default"] : {};
    return { id, colors: levels.default, levels };
  },
);

/* Coolors Exported Palette - coolors.co/d7cdcc-ffffff-59656f-9c528b-1d1e2c */
/* RGB */
export const lightThemeColors = {
  darkColor: "#31323F",
  lightColor: "#FFFFFF",
  paleColor: "#E0E0E0",
  hoverColor: "#C0C0C0",
  shadeColor: "#59656F",
  deepColor: "#414A51",
  highlightColor: "#9C528B",
  halfHighlightColor: "#9C528B80", // 50% opacity
  brightColor: "#FFFF1E",
  clearColor: "#FFFFFF00", // 0% opacity
  linkColor: "#1f78b4",
  headerText: "#FFFFFF",
  headerBackground: "#31323F",
};

// invert light and dark colors for dark theme
export const darkThemeColors = {
  darkColor: "#FFFFFF",
  lightColor: "#31323F",
  paleColor: "#515261",
  hoverColor: "#717281",
  shadeColor: "#9C528B",
  deepColor: "#414A51",
  highlightColor: "#b584f0",
  halfHighlightColor: "#b584f080", // 50% opacity
  brightColor: "#FFFF1E",
  clearColor: "#FFFFFF00", // 0% opacity
  linkColor: "#8263a8",
  headerText: "#FFFFFF",
  headerBackground: "#31323F",
};

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const defaultTheme = prefersDark ? "darkTheme" : "lightTheme";

export const setTheme = createAction("SET_THEME");
export const theme = handleAction(
  "SET_THEME",
  (state, action) => action.payload,
  defaultTheme,
);
export const getTheme = (state) => state.theme;

export const setColorScheme = createAction("SET_COLOR_SCHEME");
export const colorScheme = handleAction(
  "SET_COLOR_SCHEME",
  (state, action) => action.payload,
  { lightTheme: lightThemeColors, darkTheme: darkThemeColors },
);

export const getColorScheme = (state) => state.colorScheme;

export const getStatusColors = (state) => state.statusColors;

export const setStatusColors = createAction("STATUS_COLORS");
export const statusColors = handleAction(
  "STATUS_COLORS",
  (state, action) => action.payload,
  {
    ancestral: ancestralColor,
    descendant: descendantColor,
    direct: directColor,
    descendantHighlight,
    directHighlight,
  },
);

export const colorReducers = {
  palettes,
  selectedPalette,
  colorScheme,
  theme,
  statusColors,
};
