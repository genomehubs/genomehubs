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
  {},
);

const isPublicDomain = (license) =>
  Boolean(license?.href && license.href.includes("publicdomain"));

// Returns an image href for the node with no BY/NC/SA terms, or undefined.
const findPublicDomainImage = async ({ nodeHref, build }) => {
  const nodeUuid = (nodeHref || "").match(/nodes\/([0-9a-f-]+)/)?.[1];
  if (!nodeUuid) {
    return;
  }
  try {
    const response = await fetch(
      `https://api.phylopic.org/images?build=${build}&filter_node=${nodeUuid}&filter_license_by=false&filter_license_nc=false&filter_license_sa=false&page=0&embed_items=true`,
    );
    if (!response.ok) {
      return;
    }
    const json = await response.json();
    const uuid = json._embedded?.items?.[0]?.uuid;
    return uuid ? `images/${uuid}?build=${build}` : undefined;
  } catch (err) {
    return;
  }
};

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

  const processPhylopicResponse = async ({
    href,
    title,
    validRank,
    matchedSelf,
    nodeHref,
  }) => {
    if (href) {
      let nodeResponse = await fetch(`https://api.phylopic.org/${href}`);
      let nodeJson = await nodeResponse.json();

      if (!isPublicDomain(nodeJson._links?.license)) {
        const altHref = await findPublicDomainImage({
          nodeHref,
          build: nodeJson.build,
        });
        if (altHref) {
          const altResponse = await fetch(
            `https://api.phylopic.org/${altHref}`,
          );
          if (altResponse.ok) {
            nodeJson = await altResponse.json();
          }
        }
      }

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
          (matchedSelf && validRank.endsWith("species"))
        ) {
          response.source = "Primary";
        } else {
          response.source = matchedSelf ? "Descendant" : "Ancestral";
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
        [taxonId, ...taxIdList].join(","),
      )}`,
    );
    let json = await response.json();
    let { href, title } = json._links.primaryImage || {};
    href = href.replace(/^\/+/, "").replace(/\/$/, "");
    let external = (json._links.external || []).find((link) =>
      link.href.includes("ncbi.nlm.nih.gov/taxid"),
    );
    let nodeResponse = await fetch(`https://api.phylopic.org/${href}`);
    let nodeJson = await nodeResponse.json();
    const matchedId = external.href.split("/")[4].replace(/\?.+/, "");
    const matchedSelf = String(matchedId) === String(taxonId);
    // An id missing from the lineage must stay Ancestral, not inherit this rank.
    const validRank = matchedSelf ? rank : ranks[matchedId] || "lineage";
    return await processPhylopicResponse({
      href,
      title,
      validRank,
      matchedSelf,
      nodeHref: json._links.self?.href,
    });
  };

  const resolveByName = async ({ name, rank, taxonId, build, taxonNames }) => {
    let response = await fetch(
      `https://api.phylopic.org/nodes?build=${build}&filter_name=${encodeURIComponent(
        name.toLowerCase(),
      )}&page=0`,
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
    const nodeHref = href;
    try {
      let nodeResponse = await fetch(`https://api.phylopic.org/${href}`);
      let nodeJson = await nodeResponse.json();
      ({ href } = nodeJson._links.primaryImage);
      return await processPhylopicResponse({
        href,
        title,
        validRank: rank,
        matchedSelf: true,
        nodeHref,
      });
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
