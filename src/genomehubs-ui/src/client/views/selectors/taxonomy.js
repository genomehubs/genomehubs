import { apiUrl, getApiAttempt, setApiAttempt } from "../reducers/api";
import {
  getTaxonomies,
  getTaxonomiesFetching,
  receiveIndices,
  receiveTaxonomies,
  requestTaxonomies,
  setCurrentTaxonomy,
} from "../reducers/taxonomy";

import { setApiStatus } from "../reducers/api";
import store from "../store";

export function fetchTaxonomies() {
  return async function (dispatch) {
    const state = store.getState();
    const taxonomies = getTaxonomies(state);
    if (taxonomies.length > 0) {
      return;
    }
    const fetching = getTaxonomiesFetching(state);
    if (fetching) {
      return;
    }
    dispatch(requestTaxonomies());
    let url = `${apiUrl}/taxonomies`;
    try {
      let json;
      try {
        const response = await fetch(url);
        json = await response.json();
      } catch (error) {
        json = console.log("An error occured.", error);
      }
      dispatch(receiveTaxonomies(json));
      dispatch(setCurrentTaxonomy(json[0]));

      if (json && json.length > 0) {
        dispatch(setApiStatus(true));

        url = `${apiUrl}/indices`;
        try {
          let json;
          try {
            const response = await fetch(url);
            json = await response.json();
          } catch (error) {
            json = console.log("An error occured.", error);
          }
          dispatch(receiveIndices(json));
          // dispatch(setApiStatus(true));
        } catch (err) {
          return dispatch(setApiStatus(false));
        }
      } else {
        dispatch(setApiAttempt(getApiAttempt(state) + 1));
        dispatch(setApiStatus(false));
      }
    } catch (err) {
      dispatch(setApiAttempt(getApiAttempt(state) + 1));
      return dispatch(setApiStatus(false));
    }
  };
}
