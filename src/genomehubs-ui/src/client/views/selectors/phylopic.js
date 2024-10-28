import {
  getPhylopicIsFetching,
  getPhylopicIsFetchingById,
  getPhylopics,
  receivePhylopic,
  requestPhylopic,
} from "../reducers/phylopic";

import store from "../store";

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

    const resolveByTaxId = async ({ taxonId, lineage, rank }) => {
      let taxIdList = [];
      let ranks = {};
      lineage.forEach((taxon) => {
        taxIdList.push(taxon.taxon_id);
        ranks[taxon.taxon_id] = taxon.taxon_rank;
      });
      let response = await fetch(
        `https://api.phylopic.org/resolve/ncbi.nlm.nih.gov/taxid?objectIDs=${encodeURIComponent([taxonId, ...taxIdList].join(","))}`,
      );
      let json = await response.json();
      let { href, title } = json._links.primaryImage || {};
      let external = (json._links.external || []).find((link) =>
        link.href.includes("ncbi.nlm.nih.gov/taxid"),
      );
      let validRank =
        ranks[external.href.split("/")[4].replace(/\?.+/, "")] || rank;
      if (href) {
        let nodeResponse = await fetch(`https://api.phylopic.org/${href}`);
        let nodeJson = await nodeResponse.json();

        let { _links, attribution, uuid } = nodeJson;
        let { rasterFiles, contributor, license = "", specificNode } = _links;
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
          if (validRank.endsWith("species") && validRank == rank) {
            response.source = "Primary";
          } else {
            response.source = validRank == rank ? "Descendant" : "Ancestral";
          }
          dispatch(receivePhylopic(response));
        } else {
          dispatch(receivePhylopic({ taxonId, error: "no files" }));
          console.log({ [taxonId]: "no files" });
        }
      } else {
        dispatch(receivePhylopic({ taxonId }));
        console.log({ [taxonId]: "href" });
      }
    };

    try {
      resolveByTaxId({ taxonId, lineage, rank });
      // fetchData(scientificName.toLowerCase());
    } catch (err) {
      dispatch(receivePhylopic({ taxonId }));
      // console.log(err);
    }
  };
}
