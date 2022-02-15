import { mc } from "./memcached";

export const cacheFetch = async (req) => {
  if (mc) {
    const key = req.url;
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
      const key = req.url;
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
