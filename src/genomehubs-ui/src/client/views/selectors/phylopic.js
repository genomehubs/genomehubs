import {
  getPhylopicIsFetching,
  getPhylopicIsFetchingById,
  getPhylopics,
  receivePhylopic,
  requestPhylopic,
} from "#reducers/phylopic";

import { apiUrl } from "#reducers/api";
import store from "#store";

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function fetchPhylopic({ taxonId, taxonomy = "ncbi" }) {
  return async function (dispatch) {
    const state = store.getState();
    const phylopics = getPhylopics(state);
    if (phylopics[taxonId]) {
      return;
    }
    for (let i = 0; i < 10; i++) {
      await timeout(50 + Math.floor(Math.random() * 50));
      if (!getPhylopicIsFetching(state)) {
        let fetchingById = getPhylopicIsFetchingById(store.getState());
        if (fetchingById[taxonId]) {
          return;
        }
        dispatch(requestPhylopic(taxonId));
        break;
      }
    }
    if (phylopics[taxonId]) {
      return;
    }
    let url = `${apiUrl}/phylopic?taxonId=${encodeURIComponent(
      taxonId,
    )}&taxonomy=${taxonomy}`;

    try {
      let json;
      try {
        const response = await fetch(url);
        json = await response.json();
      } catch (error) {
        json = console.log("An error occured.", error);
      }
      if (json.phylopic && !json.phylopic.dataUri && json.phylopic.fileUrl) {
        try {
          const response = await fetch(json.phylopic.fileUrl);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = "";
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            json.phylopic.dataUri = `data:${
              response.headers.get("content-type") || "image/png"
            };base64,${btoa(binary)}`;
          }
        } catch (error) {
          // Keep the original fileUrl as a fallback when the remote asset is unavailable.
        }
      }
      dispatch(receivePhylopic(json.phylopic || { taxonId }));
    } catch (err) {
      dispatch(receivePhylopic({ taxonId }));
      // console.log(err);
    }
  };
}
