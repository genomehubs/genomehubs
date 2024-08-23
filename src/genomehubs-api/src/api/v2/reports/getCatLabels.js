import { client } from "../functions/connection.js";
import { indexName } from "../functions/indexName.js";

const queryByName = ({ taxon, rank }) => {
  return {
    query: {
      bool: {
        filter: [
          {
            multi_match: {
              query: taxon,
              fields: ["taxon_id", "scientific_name"],
            },
          },
          { match: { taxon_rank: rank } },
        ],
      },
    },
    _source: {
      includes: [
        "taxon_id",
        "taxon_rank",
        "scientific_name",
        "parent",
        "taxon_names.*",
        "lineage.*",
      ],
    },
  };
};

export const getCatLabels = async ({
  cat,
  cats,
  apiParams,
  taxonomy,
  key = "scientific_name",
}) => {
  let index = indexName({ ...apiParams, result: "taxon", taxonomy });
  let qBody = [];
  let labels = [];
  cats.forEach((obj) => {
    qBody.push({ index });
    qBody.push(queryByName({ taxon: obj.key, rank: cat }));
  });
  const { body } = await client
    .msearch(
      {
        body: qBody,
        rest_total_hits_as_int: true,
      },
      { meta: true }
    )
    .catch((err) => {
      return err.meta;
    });
  if (body.responses) {
    body.responses.forEach((doc, i) => {
      if (doc.hits.total == 1) {
        let label = cats[i];
        label.label = doc.hits.hits[0]._source[key];
        labels.push(label);
      }
    });
  }

  return labels;
};
