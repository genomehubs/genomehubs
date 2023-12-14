import { createAction, handleActions } from "redux-actions";

import createCachedSelector from "re-reselect";
import immutableUpdate from "immutable-update";
import store from "../store";

const requestPhylopic = createAction("REQUEST_PHYLOPIC");
const receivePhylopic = createAction(
  "RECEIVE_PHYLOPIC",
  (json) => json,
  () => ({ receivedAt: Date.now() })
);
export const resetPhylopic = createAction("RESET_PHYLOPIC");

const defaultState = () => ({
  isFetching: false,
  allIds: [],
  byId: {},
});

function onReceivePhylopic(state, action) {
  const { payload: phylopic, meta } = action;
  const id = phylopic.taxonId;

  const updatedWithPhylopicState = immutableUpdate(state, {
    byId: { [id]: phylopic },
  });

  const updatedWithPhylopicList = immutableUpdate(updatedWithPhylopicState, {
    allIds: [...new Set(updatedWithPhylopicState.allIds.concat(id))],
  });

  return immutableUpdate(updatedWithPhylopicList, {
    isFetching: false,
    lastUpdated: meta.receivedAt,
  });
}

const phylopics = handleActions(
  {
    REQUEST_PHYLOPIC: (state, action) =>
      immutableUpdate(state, {
        isFetching: true,
      }),
    RECEIVE_PHYLOPIC: onReceivePhylopic,
    RESET_PHYLOPIC: defaultState,
  },
  {
    isFetching: false,
    allIds: [],
    byId: {},
  }
);

export const getPhylopics = (state) => state.phylopics.byId || {};

export const getPhylopicIsFetching = (state) => state.phylopics.isFetching;

export const getPhylopicByTaxonId = createCachedSelector(
  getPhylopics,
  (_state, taxonId) => taxonId,
  (phylopics, taxonId) => {
    return phylopics[taxonId];
  }
)((_state, taxonId) => taxonId);

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function fetchPhylopic({ taxonId, scientificName, lineage, rank }) {
  return async function (dispatch) {
    const state = store.getState();
    const phylopics = getPhylopics(state);
    if (phylopics[taxonId]) {
      return;
    }
    for (let i = 0; i < 10; i++) {
      await timeout(100 + Math.floor(Math.random() * 100));
      if (!getPhylopicIsFetching(state)) {
        dispatch(requestPhylopic());
        break;
      }
    }

    const lookupName = async (name) => {
      let response = await fetch(
        `https://api.phylopic.org/autocomplete?query=${name}`
      );
      let json = await response.json();
      if (json.matches && json.matches.includes(name)) {
        return true;
      }
    };

    const fetchData = async (name) => {
      let validName;
      let validRank;
      if (await lookupName(name)) {
        validName = name;
        validRank = rank;
      } else {
        // use lineage
        for (let { scientific_name, taxon_rank } of lineage) {
          if (await lookupName(scientific_name.toLowerCase())) {
            validName = scientific_name.toLowerCase();
            validRank = taxon_rank;
            break;
          }
        }
      }
      if (validName) {
        try {
          let buildResponse = await fetch(
            `https://api.phylopic.org/nodes?filter_name=${validName}`
          );
          let buildJson = await buildResponse.json();
          let filterResponse = await fetch(
            `https://api.phylopic.org${buildJson._links.firstPage.href}`
          );
          let filterJson = await filterResponse.json();
          let { href, title } = filterJson._links.items[0] || {};
          if (href) {
            let nodeResponse = await fetch(
              `https://api.phylopic.org${href}&embed_primaryImage=true`
            );
            let nodeJson = await nodeResponse.json();
            let { _links, attribution, uuid } = nodeJson._embedded.primaryImage;
            let {
              rasterFiles,
              contributor,
              license = "",
              specificNode,
            } = _links;
            if (rasterFiles) {
              let rasterFile =
                rasterFiles.length > 1 ? rasterFiles[1] : rasterFiles[0];
              let [width, height] = rasterFile.sizes.split("x");

              let response = {
                taxonId,
                fileUrl: rasterFile.href,
                ratio: width / height,
                attribution,
                license,
                contributor,
                imageName: specificNode.title,
                sourceUrl: `https://www.phylopic.org/images/${uuid}/`,
                imageRank: validRank,
              };
              if (validRank.endsWith("species")) {
                response.source = "Primary";
              } else {
                response.source = rank ? "Descendant" : "Ancestral";
              }
              dispatch(receivePhylopic(response));
            } else {
              console.log({ [taxonId]: "no files" });
            }
          } else {
            console.log({ [taxonId]: "href" });
          }
        } catch (err) {
          console.log(err);
        }
      }
    };
    try {
      fetchData(scientificName.toLowerCase());
    } catch (err) {
      console.log(err);
    }
  };
}

export const phylopicReducers = {
  phylopics,
};
