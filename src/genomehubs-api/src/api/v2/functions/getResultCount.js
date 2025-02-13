import { getResults } from "./getResults.js";
import { setExclusions } from "./setExclusions.js";

export const getResultCount = async (params) => {
  params.size = 0;
  let exclusions = setExclusions(params);
  let result = await getResults({ ...params, exclusions });
  let response = { status: {}, count: 0 };
  ["success", "error"].forEach((key) => {
    if (result.status.hasOwnProperty(key)) {
      response.status[key] = result.status[key];
    }
  });
  if (result.status.hasOwnProperty("hits")) {
    response.count = result.status.hits;
  }
  return response;
};
