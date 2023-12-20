import { analysisReducers } from "./analysis";
import { apiReducers } from "./api";
import { autocompleteReducers } from "./autocomplete";
import { colorReducers } from "./color";
import { combineReducers } from "redux";
import { descendantsReducers } from "./descendants";
import { exploreReducers } from "./explore";
import { fileReducers } from "./file";
import { geographyReducers } from "./geography";
import { lookupReducers } from "./lookup";
import { messageReducers } from "./message";
import { pageReducers } from "./pages";
import { phylopicReducers } from "./phylopic";
import { recordReducers } from "./record";
import { reportReducers } from "./report";
import { routeReducers } from "./routes";
import { searchReducers } from "./search";
import { taxonomyRanks } from "../selectors/types";
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
  lookupReducers,
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
  if (action.type === "REFRESH") {
    let { cookieConsent, analytics, theme } = state;
    state = {
      analytics,
      cookieConsent,
      theme,
    };
  }
  return appReducer(state, action);
};

export default rootReducer;
