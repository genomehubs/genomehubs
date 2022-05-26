import { mc } from "./memcached";
import qs from "qs";

const sortUrl = (url) => {
  let [path, search] = url.split(/[\?#]/);
  let { queryId, ...options } = qs.parse(search);
  let sortedOptions = Object.entries(options || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .reduce((r, [key, value]) => ({ ...r, [key]: value }), {});
  return `${path}?${qs.stringify(sortedOptions)}`;
};

export const cacheFetch = async (req) => {
  if (mc) {
    const key = sortUrl(req.url);
    try {
      let cachedData = await mc.get(key);
      return JSON.parse(cachedData);
    } catch {
      return false;
    }
  } else {
    return false;
  }
};

export const cacheStore = async (req, obj) => {
  if (mc) {
    try {
      const key = sortUrl(req.url);
      const value = JSON.stringify(obj);
      if (value.length <= 1024 * 1024 * 32) {
        mc.set(key, JSON.stringify(obj));
      }
      return true;
    } catch {
      return false;
    }
  }
};
