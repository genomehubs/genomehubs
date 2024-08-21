import { analysisReducers } from "./analysis";
import { apiReducers } from "./api";
import { autocompleteReducers } from "./autocomplete";
import { colorReducers } from "./color";
import { combineReducers } from "redux";
import { descendantsReducers } from "./descendants";
import { exploreReducers } from "./explore";
import { fileReducers } from "./file";
import { geographyReducers } from "./geography";
import { loadingReducers } from "./loading";
import { lookupReducers } from "./lookup";
import { mapReducers } from "./map";
import { messageReducers } from "./message";
import { pageReducers } from "./pages";
import { phylopicReducers } from "./phylopic";
import { recordReducers } from "./record";
import { reportReducers } from "./report";
import { routeReducers } from "./routes";
import { searchReducers } from "./search";
import { taxonomyReducers } from "./taxonomy";
import { trackingReducers } from "./tracking";
import { treeReducers } from "./tree";
import { typeReducers } from "./types";

const allReducers = Object.assign(
  {},
  analysisReducers,
  apiReducers,
  autocompleteReducers,
  colorReducers,
  descendantsReducers,
  exploreReducers,
  fileReducers,
  geographyReducers,
  loadingReducers,
  lookupReducers,
  mapReducers,
  messageReducers,
  pageReducers,
  phylopicReducers,
  recordReducers,
  reportReducers,
  routeReducers,
  searchReducers,
  taxonomyReducers,
  trackingReducers,
  treeReducers,
  typeReducers
);

const appReducer = combineReducers(allReducers);

const rootReducer = (state, action) => {
  let newState = state;
  if (action.type === "REFRESH") {
    let { cookieConsent, theme } = state;
    newState = {
      cookieConsent,
      theme,
    };
  }
  return appReducer(newState, action);
};

export default rootReducer;
