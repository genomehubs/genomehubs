import { getRecordsById } from "../functions/getRecordsById.js";
import { logError } from "../functions/logger.js";
import spdxLicenseList from "spdx-license-list";

let phylopics = {};

const licensesByUrl = Object.entries(spdxLicenseList).reduce(
  (acc, [key, value]) => {
    if (value.url) {
      acc[value.url.replace("/legalcode", "/").replace("//$", "/")] = key;
    }
    return acc;
  },
  {}
);

const fetchPhylopic = async ({
  taxonId,
  lineage,
  rank,
  scientificName,
  taxonNames,
}) => {
  if (phylopics[taxonId]) {
    return phylopics[taxonId];
  }

  const processPhylopicResponse = async ({ href, title, validRank }) => {
    if (href) {
      let nodeResponse = await fetch(`https://api.phylopic.org/${href}`);
      let nodeJson = await nodeResponse.json();

      let { _links, attribution, uuid, build } = nodeJson;
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
          license: { ...license, name: licensesByUrl[license.href] },
          contributor,
          imageName: specificNode.title,
          sourceUrl: `https://www.phylopic.org/images/${uuid}/`,
          imageRank: validRank,
          build,
        };
        if (
          scientificName == specificNode.title ||
          (validRank.endsWith("species") && validRank == rank)
        ) {
          response.source = "Primary";
        } else {
          response.source = validRank == rank ? "Descendant" : "Ancestral";
        }
        return { status: { success: true }, phylopic: response };
      } else {
        return { status: { success: false, error: "no files" } };
      }
    } else {
      return { status: { success: false, error: "no href" } };
    }
  };

  const resolveByTaxId = async ({ taxonId, lineage, rank, scientificName }) => {
    let taxIdList = [];
    let ranks = {};
    lineage.forEach((taxon) => {
      taxIdList.push(taxon.taxon_id);
      ranks[taxon.taxon_id] = taxon.taxon_rank;
    });
    let response = await fetch(
      `https://api.phylopic.org/resolve/ncbi.nlm.nih.gov/taxid?objectIDs=${encodeURIComponent(
        [taxonId, ...taxIdList].join(",")
      )}`
    );
    let json = await response.json();
    let { href, title } = json._links.primaryImage || {};
    let external = (json._links.external || []).find((link) =>
      link.href.includes("ncbi.nlm.nih.gov/taxid")
    );
    let nodeResponse = await fetch(`https://api.phylopic.org/${href}`);
    let nodeJson = await nodeResponse.json();
    let validRank =
      ranks[external.href.split("/")[4].replace(/\?.+/, "")] || rank;
    return await processPhylopicResponse({ href, title, validRank });
  };

  const resolveByName = async ({ name, rank, taxonId, build, taxonNames }) => {
    let response = await fetch(
      `https://api.phylopic.org/nodes?build=${build}&filter_name=${encodeURIComponent(
        name.toLowerCase()
      )}&page=0`
    );
    let json = await response.json();
    let { items = [] } = json._links || {};
    if (items.length >= 1) {
      let synonyms = taxonNames.map(({ name }) => name.toLowerCase());
      items =
        items.filter(({ title }) => synonyms.includes(title.toLowerCase())) ||
        items[0];
    }
    if (items.length != 1) {
      return {
        status: { success: false, error: `no unique match for ${name}` },
      };
    }
    let { href, title } = items[0];
    try {
      let nodeResponse = await fetch(`https://api.phylopic.org/${href}`);
      let nodeJson = await nodeResponse.json();
      ({ href } = nodeJson._links.primaryImage);
      return await processPhylopicResponse({ href, title, validRank: rank });
    } catch (err) {
      return {
        status: { success: false, error: "unable to fetch by taxon name" },
      };
    }
  };

  let response;

  try {
    response = await resolveByTaxId({ taxonId, lineage, rank, scientificName });
  } catch (err) {
    response = { status: { success: false, error: "unable to fetch" } };
  }

  if (response.status.success && response.phylopic.source == "Ancestral") {
    let newResponse = await resolveByName({
      name: scientificName,
      rank,
      taxonId,
      build: response.phylopic.build,
      taxonNames,
    });
    if (newResponse.status.success) {
      response = newResponse;
    }
  }
  return response;
};

export const getPhylopic = async (req, res) => {
  try {
    let response = {};
    let startTime = performance.now();
    const q = req.expandedQuery || req.query || {};
    let { taxonId, taxonomy } = q;
    if (phylopics[taxonId]) {
      let endTime = performance.now();
      return res.status(200).send(JSON.stringify(phylopics[taxonId], null, 2));
    }
    let record = await getRecordsById({
      recordId: taxonId,
      result: "taxon",
      taxonomy,
    });
    let {
      lineage,
      taxon_rank: rank,
      scientific_name: scientificName,
      taxon_names: taxonNames,
    } = record.records[0].record;

    let midTime = performance.now();
    response = await fetchPhylopic({
      taxonId,
      lineage,
      rank,
      scientificName,
      taxonNames,
    });
    let endTime = performance.now();
    phylopics[taxonId] = response;
    return res.status(200).send(JSON.stringify(response, null, 2));
  } catch (message) {
    logError({ req, message });
    return res.status(400).send({ status: "error" });
  }
};
