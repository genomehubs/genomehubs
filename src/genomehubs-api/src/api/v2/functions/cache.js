import { logMemcache } from "./logger";
// import { mc } from "./memcached";
import qs from "qs";
import { rd } from "./redis";

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
  const store = rd || mc;
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
  const action = "STORE";
  const store = rd || mc;
  if (store) {
    try {
      key = sortUrl(req.url);
      success = await store.set(key, JSON.stringify(obj), "ex", fourDays);
      success = success == "OK";
    } catch {
      success = false;
    }
    logMemcache({ key, action, success });
  }
  return success;
};
