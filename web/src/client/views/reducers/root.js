import { combineReducers } from 'redux';

import { locationReducers } from './location';
import { colorReducers } from './color';
import { paneReducers } from './panes';
import { trackingReducers } from './tracking';

const allReducers = Object.assign(
  {},
  locationReducers,
  colorReducers,
  paneReducers,
  trackingReducers
);

const appReducer = combineReducers(allReducers);

const rootReducer = (state, action) => {
  if (action.type === 'REFRESH') {
    let cookieConsent = state.cookieConsent;
    let analytics = state.analytics;
    let pathname = state.pathname;
    let hashString = state.hashString;
    let theme = state.theme;
    state = {
      analytics,
      cookieConsent,
      pathname,
      hashString,
      theme,
    };
  }
  return appReducer(state, action);
};

export default rootReducer;
