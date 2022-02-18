import { generateQuery } from "./generateQuery";
import { indexName } from "./indexName";

export const getResults = async (params) => {
  let query = await generateQuery({ ...params });
  let index = indexName({ ...params });
  return query.func({ index, ...query.params });
};
