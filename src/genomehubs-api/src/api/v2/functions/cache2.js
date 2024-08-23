import { logMemcache } from "./logger.js";
import qs from "qs";
import { rd } from "./redisClient.js";

const fourDays = 4 * 24 * 60 * 60;

const sortUrl = (url) => {
  let [path, search] = url.split(/[\?#]/);
  let { queryId, ...options } = qs.parse(search);
  let sortedOptions = Object.entries(options || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .reduce((r, [key, value]) => ({ ...r, [key]: value }), {});
  return `${path}?${qs.stringify(sortedOptions)}`;
};

export const cacheFetch = async (req) => {
  let key;
  let cachedData = false;
  const action = "FETCH";
  const store = rd;
  if (store) {
    let success = false;
    key = sortUrl(req.url);
    try {
      cachedData = JSON.parse(await store.get(key));
      if (cachedData) {
        success = true;
      }
    } catch {
      success = false;
    }
    logMemcache({ key, action, success });
  }
  return cachedData;
};

export const cacheStore = async (req, obj) => {
  let key, success;
  console.log(req);
  const action = "STORE";
  const store = rd;
  console.log(store);
  if (store) {
    try {
      key = sortUrl(req.url);
      console.log(key);
      // success = await store.setex(key, fourDays, JSON.stringify(obj));
      console.log(success);
      success = success == "OK";
    } catch (err) {
      console.log(err);
      success = false;
    }
    console.log(success);
    logMemcache({ key, action, success });
  }
  return success;
};
