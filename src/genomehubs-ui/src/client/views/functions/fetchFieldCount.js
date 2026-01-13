import { apiUrl } from "#reducers/api";

export const fetchFieldCount = async ({ queryString, setCount }) => {
  const endpoint = "search";
  let url = `${apiUrl}/${endpoint}?${queryString}`;
  // try {
  let json;
  try {
    const response = await fetch(url);
    json = await response.json();
  } catch (error) {
    json = console.log("An error occured.", error);
  }
  if (json && json.status && json.status.success && json.status.hits >= 1) {
    return Object.values(json.results[0].result.fields).filter(
      (value) => value && Object.keys(value).length > 0
    ).length;
  }
  return 0;
};

export default fetchFieldCount;
