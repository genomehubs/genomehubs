import { checkResponse } from "./checkResponse";
import { client } from "./connection";
import { config } from "./config.js";

export const fetchIndices = async (release = config.release) => {
  const { body } = await client.cat.indices({}, { meta: true }).catch((err) => {
    return err.meta;
  });
  let indices = [];
  if (body) {
    indices = body
      .split("\n")
      .map((row) => row.split(/\s+/))
      .filter(
        (row) =>
          row.length > 2 &&
          row[2].match(`--${config.taxonomy}--`) &&
          row[2].match(`--${release}`) &&
          row[6] > 0
      )
      .map((row) => row[2].split("--")[0]);
  }
  return indices;
};
