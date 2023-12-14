import { apiUrl } from "../reducers/api";

export const fetchDescendantTaxIds = async ({ recordId, setCount }) => {
  const endpoint = "search";
  let url = `${apiUrl}/${endpoint}?query=tax_tree%28${recordId}%29%20AND%20tax_depth%281%29&fields=none`;
  // try {
  console.log(url);
  let json;
  try {
    const response = await fetch(url);
    json = await response.json();
  } catch (error) {
    json = console.log("An error occured.", error);
  }
  if (json && json.status && json.status.success && json.status.hits >= 1) {
    console.log(json.results);
    return json.results.map((o) => o.result.taxon_id);
  }
  return [];
};

export default fetchDescendantTaxIds;
