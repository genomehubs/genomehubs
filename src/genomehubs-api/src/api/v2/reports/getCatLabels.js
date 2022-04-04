import { client } from "../functions/connection";
import { indexName } from "../functions/indexName";

export const getCatLabels = async ({
  cat,
  cats,
  apiParams,
  taxonomy,
  key = "scientific_name",
}) => {
  let index = indexName({ ...apiParams, taxonomy });
  let qBody = [];
  let labels = [];
  cats.forEach((obj) => {
    qBody.push({ index });
    qBody.push({ id: "taxon_by_name", params: { taxon: obj.key, rank: cat } });
  });
  const { body } = await client
    .msearchTemplate({
      body: qBody,
      rest_total_hits_as_int: true,
    })
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
