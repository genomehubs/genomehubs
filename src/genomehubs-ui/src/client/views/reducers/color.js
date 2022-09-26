import { createAction, handleAction, handleActions } from "redux-actions";
import { createD3Palette, createPalette } from "./color/createPalette";
import { createSelector, createSelectorCreator } from "reselect";
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
import immutableUpdate from "immutable-update";
import paired12 from "./color/paired12";
import store from "../store";

export const ancestralColor = ANCESTRAL_COLOR || "red";
export const descendantColor = DESCENDANT_COLOR || "orange";
export const directColor = DIRECT_COLOR || "green";
export const descendantHighlight = DESCENDANT_HIGHLIGHT || "orange";
export const directHighlight = DIRECT_HIGHLIGHT || "green";

export const addPalette = createAction("ADD_PALETTE");
export const editPalette = createAction("EDIT_PALETTE");

const brewerPalette = [
  "rgb(31,120,180)",
  "rgb(166,206,227)",
  "rgb(51,160,44)",
  "rgb(178,223,138)",
  "rgb(227,26,28)",
  "rgb(251,154,153)",
  "rgb(255,127,0)",
  "rgb(253,191,111)",
  "rgb(106,61,154)",
  "rgb(202,178,214)",
];

export const palettes = handleActions(
  {
    ADD_PALETTE: (state, action) =>
      immutableUpdate(state, {
        byId: { [action.payload.id]: action.payload },
        allIds: [...state.allIds, action.payload.id],
      }),
    EDIT_PALETTE: (state, action) => {
      let id = action.payload.id;
      let arr = action.payload[id].slice(0);
      state.byId[id].forEach((col, i) => {
        if (!arr[i]) arr[i] = col;
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
      batlowS: createPalette(batlowS),
      batlow: createPalette(batlow, 50),
      cividis: createD3Palette(interpolateCividis, 50),
      cubeHelix: createD3Palette(interpolateCubehelixDefault, 50),
      cool: createD3Palette(interpolateCool, 50),
      warm: createD3Palette(interpolateWarm, 50),
      plasma: createD3Palette(interpolatePlasma, 50),
      magma: createD3Palette(interpolateMagma, 50),
      inferno: createD3Palette(interpolateInferno, 50),
      turbo: createD3Palette(interpolateTurbo, 50),
      viridis: createD3Palette(interpolateViridis, 50),
      standard: { id: "default", default: brewerPalette, levels: [] },
      paired: createD3Palette(schemePaired, 12),
      category: createD3Palette(schemeCategory10, 10),
      dark: createD3Palette(schemeDark2, 8),
      accent: createD3Palette(schemeAccent, 8),
      tableau: createD3Palette(schemeTableau10, 10),
      default: createD3Palette(interpolateViridis, 50),
    },
    allIds: ["default", "batlow", "batlowS", "cividis", "paired", "viridis"],
  }
);

export const getSelectedPalette = (state) => state.selectedPalette;

export const selectPalette = createAction("SELECT_PALETTE");
export const selectedPalette = handleAction(
  "SELECT_PALETTE",
  (state, action) => action.payload,
  "default"
);

// export const choosePalette = (palette) => {
//   return function (dispatch) {
//     let values = { palette };
//     dispatch(queryToStore({ values }));
//   };
// };

// export const chooseColors = (colors) => {
//   return function (dispatch) {
//     let existing = getColorPalette(store.getState());
//     let values = { colors: { colors, existing } };
//     dispatch(queryToStore({ values }));
//   };
// };

export const getAllPalettes = (state) => state.palettes;

export const getColorPalette = createSelector(
  getSelectedPalette,
  getAllPalettes,
  (id, palettes) => {
    let colors = palettes ? palettes.byId[id] : [];
    return { id, colors };
  }
);

export const getUserPalette = createSelector(getAllPalettes, (palettes) => {
  let id = "user";
  let colors = palettes ? palettes.byId[id] : [];
  return { id, colors };
});

export const getDefaultPalette = createSelector(
  getSelectedPalette,
  getAllPalettes,
  (id, palettes) => {
    let levels = palettes ? palettes.byId[id] : {};
    return { id, colors: levels.default, levels };
  }
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
  schemeColors
);

export const getColorScheme = (state) => state.colorScheme;

export const setTheme = createAction("SET_THEME");
export const theme = handleAction(
  "SET_THEME",
  (state, action) => action.payload,
  "Light"
);
export const getTheme = (state) => state.theme;

export const colorReducers = {
  palettes,
  selectedPalette,
  colorScheme,
  theme,
};
