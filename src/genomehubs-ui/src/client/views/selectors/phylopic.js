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
      if (json.phylopic && json.phylopic.source !== "Ancestral") {
        json.phylopic.dataUri = await fetch(json.phylopic.fileUrl)
          .then((response) => response.arrayBuffer())
          .then((buffer) => {
            let binary = "";
            let bytes = new Uint8Array(buffer);
            let len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            return `data:image/png;base64,${btoa(binary)}`;
          });
      }
      dispatch(receivePhylopic(json.phylopic || { taxonId }));
    } catch (err) {
      dispatch(receivePhylopic({ taxonId }));
      // console.log(err);
    }
  };
}
