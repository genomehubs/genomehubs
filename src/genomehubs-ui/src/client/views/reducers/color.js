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

export const ancestralColor = ANCESTRAL_COLOR || "red";
export const descendantColor = DESCENDANT_COLOR || "orange";
export const directColor = DIRECT_COLOR || "green";
export const descendantHighlight = DESCENDANT_HIGHLIGHT || "orange";
export const directHighlight = DIRECT_HIGHLIGHT || "green";

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
  {
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
  },
);

export const getSelectedPalette = (state) => state.selectedPalette;

export const selectPalette = createAction("SELECT_PALETTE");
export const selectedPalette = handleAction(
  "SELECT_PALETTE",
  (state, action) => ({ ...state, ...action.payload }),
  { id: "default", offset: 0, reverse: true },
);

export const getAllPalettes = (state) => state.palettes;

export const getDefaultPalette = createSelector(
  getSelectedPalette,
  getAllPalettes,
  ({ id, offset, reverse }, palettes) => {
    let levels = structuredClone(
      palettes ? palettes.byId[id] || palettes.byId["default"] : {},
    );
    for (let [key, arr] of Object.entries(levels)) {
      if (reverse) {
        levels[key] = arr.slice().reverse();
      }
      if (offset) {
        levels[key] = arr.slice(offset).concat(arr.slice(0, offset));
      }
    }

    return { id, colors: levels.default, levels };
  },
);

/* Coolors Exported Palette - coolors.co/d7cdcc-ffffff-59656f-9c528b-1d1e2c */
/* RGB */
export const schemeColors = {
  darkColor: "rgb(49, 50, 63)",
  lightColor: "rgb(255, 255, 255)",
  shadeColor: "rgb(89, 101, 111)",
  deepColor: "rgb(65,74,81)",
  highlightColor: "rgb(156, 82, 139)",
  halfHighlightColor: "rgba(156, 82, 139, 0.5)",
  paleColor: "rgb(215, 205, 204)",
  brightColor: "rgb(255,255,30)",
  clearColor: "rgba(255,255,255,0)",
};

export const setColorScheme = createAction("SET_COLOR_SCHEME");
export const colorScheme = handleAction(
  "SET_COLOR_SCHEME",
  (state, action) => action.payload,
  schemeColors,
);

export const getColorScheme = (state) => state.colorScheme;

export const setTheme = createAction("SET_THEME");
export const theme = handleAction(
  "SET_THEME",
  (state, action) => action.payload,
  "Light",
);
export const getTheme = (state) => state.theme;

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
