import { clearProgress } from "./progress.js";
import { logMemcache } from "./logger.js";
import qs from "qs";
import { rd } from "./redisClient.js";

const fourDays = 4 * 24 * 60 * 60;
const tenSeconds = 10 * 1000;

const sortUrl = (url) => {
  let [path, search] = url.split(/[\?#]/);
  let { queryId, ...options } = qs.parse(search);
  let sortedOptions = Object.entries(options || {})
    .sort((a, b) => a[0].localeCompare(b[0]))
    .reduce((r, [key, value]) => ({ ...r, [key]: value }), {});
  return `${path}?${qs.stringify(sortedOptions)}`;
};

export const cacheFetch = async ({ url, persist, queryId }) => {
  let key;
  let cachedData = false;
  const action = "FETCH";
  const store = rd;
  if (store) {
    let success = false;
    let keys = await store.keys("*");
    key = sortUrl(url);
    try {
      cachedData = JSON.parse(await store.get(key));
      if (cachedData) {
        success = true;
        if (persist && persist == "once") {
          clearProgress(queryId);
          store.del(key);
        }
      }
    } catch {
      success = false;
    }
    logMemcache({ key, action, success });
  }
  return cachedData;
};

export const cachedResponse = async (req, limit = tenSeconds) => {
  const store = rd;
  if (!store) {
    return new Promise((resolve) => {
      false;
    });
  }
  return new Promise((resolve) => {
    let elapsed = 0;
    let duration = 1000;
    const interval = setInterval(() => {
      cacheFetch(req).then((cachedData) => {
        if (cachedData) {
          resolve(cachedData);
          clearInterval(interval);
        } else if (cachedData === false || elapsed >= limit) {
          resolve({ status: { success: false, message: "timeout" } });
          clearInterval(interval);
        }
        elapsed += duration;
      });
    }, duration);
  });
};

export const cacheStore = async (req, obj) => {
  let key, success;
  const action = "STORE";
  const store = rd;
  if (store) {
    try {
      key = sortUrl(req.url);
      success = await store.setex(key, fourDays, JSON.stringify(obj));
      success = success == "OK";
    } catch (err) {
      success = false;
    }
    logMemcache({ key, action, success });
  }
  return success;
};

const withTimeout = async (millis, promise) => {
  let timeoutPid;
  const timeout = new Promise(
    (_, reject) =>
      (timeoutPid = setTimeout(
        () => reject(`Timed out after ${millis} ms.`),
        millis
      ))
  );
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutPid) {
      clearTimeout(timeoutPid);
    }
  }
};
export const pingCache = async () => {
  const store = rd;
  if (store) {
    try {
      let pong = await withTimeout(100, store.ping());
      return pong == "PONG";
    } catch {
      return false;
    }
  }
  return false;
};
