import Memcached from "memcached-promise";
import { config } from "./config.js";

export const mc = config.memcached
  ? new Memcached(config.memcached, {
      maxExpiration: 2592000,
      namespace: `${config.hub}${config.separator}${config.release}`,
      debug: false,
      timeout: 1000,
      retries: 2,
      maxValue: 1024 * 1024 * 32,
    })
  : undefined;
