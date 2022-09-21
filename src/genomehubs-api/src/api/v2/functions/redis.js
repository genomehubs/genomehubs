// import { createClient } from "redis";
import Redis from "ioredis";
import { config } from "./config";

let client;
try {
  client = config.redis ? new Redis(config.redis) : undefined;
  if (client) {
    client.on("error", (error) => {
      client = undefined;
    });
  }
} catch (err) {
  client = undefined;
}

export const rd = client;
