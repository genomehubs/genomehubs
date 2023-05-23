import { client } from "./connection";
import { config } from "./config.js";

// const elasticClient = require("./elasticClient");
export const fetchTaxonomies = async (release = config.release) => {
  // let client;
  // try {
  //   const { Client } = require("@elastic/elasticsearch");

  //   new Client("http://localhost:9200");
  // } catch (err) {
  //   console.log(err);
  //   return ["error"];
  // }
  if (!client) {
    return ["broken"];
  }
  const { body } = await client.cat.indices({}, { meta: true }).catch((err) => {
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
};
