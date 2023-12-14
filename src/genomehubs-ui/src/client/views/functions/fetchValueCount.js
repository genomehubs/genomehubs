import { apiUrl } from "../reducers/api";

export const fetchValueCount = async ({ queryString, setCount }) => {
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
    let value;
    try {
      ({ value } = json.results[0].result.fields[json.fields[0]]);
    } catch {
      return 0;
    }
    console.log(value);
    if (Array.isArray(value)) {
      return value.length;
    }
    return 1;
  }
  return 0;
};

export default fetchValueCount;
