import Redis from "ioredis";

const rd = new Redis();

rd.on("error", (err) => console.log("Redis Client Error", err));
rd.on("connect", () => console.log("Redis Client Connected"));

export { rd };
