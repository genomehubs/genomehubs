import { logMemcache } from "./logger";
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
  let key;
  let cachedData = false;
  const action = "FETCH";
  if (mc) {
    key = sortUrl(req.url);
    try {
      cachedData = JSON.parse(await mc.get(key));
      logMemcache({ key, action, success: true });
    } catch {
      logMemcache({ key, action, success: false });
    }
  }
  return cachedData;
};

export const cacheStore = async (req, obj) => {
  let key, success;
  const action = "STORE";
  if (mc) {
    try {
      key = sortUrl(req.url);
      const value = JSON.stringify(obj);
      if (value.length <= 1024 * 1024 * 32) {
        success = await mc.set(key, JSON.stringify(obj), 3600);
      }
      logMemcache({ key, action, success });
    } catch {
      logMemcache({ key, action, success: false });
      success = false;
    }
  }
  return success;
};
