const apiUrl = API_URL;

export const fetchCount = async ({ queryString, setCount }) => {
  const endpoint = "count";
  let url = `${apiUrl}/${endpoint}?${queryString}`;
  // try {
  let json;
  try {
    const response = await fetch(url);
    json = await response.json();
  } catch (error) {
    json = console.log("An error occured.", error);
  }
  if (json && json.status && json.status.success) {
    return json.count;
  }
  console.log(json);
  return 0;
};

export default fetchCount;
