import { checkResponse } from "./checkResponse";
import { client } from "./connection";
import { config } from "./config.js";

export const fetchTaxonomies = async (release = config.release) => {
  const { body } = await client.cat.indices({}).catch((err) => {
    return err.meta;
  });
  let taxonomies = body
    .split("\n")
    .map((row) => row.split(/\s+/))
    .filter(
      (row) =>
        row.length > 2 && row[2].match("taxon--") && row[2].match(release)
    )
    .map((row) => row[2].split("--")[1]);
  let sorted = [
    config.taxonomy,
    ...taxonomies.filter((taxonomy) => taxonomy != config.taxonomy),
  ];
  return sorted;
  // let status = checkResponse({ body });
  // let types = {};
  // if (status.hits) {
  //   body.hits.hits.forEach((hit) => {
  //     if (!types[hit._source.group]) {
  //       types[hit._source.group] = {};
  //     }
  //     types[hit._source.group][hit._source.name] = hit._source;
  //   });
  // }
  // if (result != "multi") {
  //   return types[result];
  // }
  // return types;
};
