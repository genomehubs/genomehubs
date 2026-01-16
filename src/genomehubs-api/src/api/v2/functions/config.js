import dotenv from "dotenv";
dotenv.config({ quiet: true });

const GH_HOST = process.env.GH_HOST || "localhost";
const GH_CLIENT_PORT = Number(process.env.GH_CLIENT_PORT) || 8880;
const GH_API_PORT =
  Number(process.env.GH_API_PORT) || Number(process.env.GH_PORT) || 3000;
const GH_API_URL =
  process.env.GH_API_URL ||
  process.env.GH_URL ||
  GH_HOST + ":" + GH_API_PORT + "/api/v2";
const GH_HTTPS = String(process.env.GH_HTTPS) === "true";
const GH_ORIGINS = process.env.GH_ORIGINS
  ? process.env.GH_ORIGINS.split(" ")
  : [
      "localhost",
      "null",
      GH_HOST,
      (GH_HTTPS ? "https" : "http") + "://" + GH_HOST + ":" + GH_CLIENT_PORT,
    ];
const release = process.env.GH_RELEASE || "v0.1";

export const config = {
  hub: process.env.GH_HUBNAME || "demo",
  hubPath: process.env.GH_HUBPATH || "~/genomehubs/demo",
  node: process.env.GH_NODE || "http://localhost:9200",
  separator: process.env.GH_SEPARATOR || "--",
  taxonomy: process.env.GH_TAXONOMY || "ncbi",
  release,
  source: process.env.GH_SOURCE || undefined,
  accessLog: process.env.GH_ACCESS_LOG || "./logs/access.log",
  errorLog: process.env.GH_ERROR_LOG || "./logs/error.log",
  memcacheLog: process.env.GH_MEMCACHE_LOG || "./logs/memcache.log",
  port: GH_API_PORT,
  cors: GH_ORIGINS,
  https: GH_HTTPS,
  keyFile: process.env.GH_KEYFILE,
  certFile: process.env.GH_CERTFILE,
  description: process.env.GH_DESCRIPTION || "Genomes on a Tree OpenAPI test",
  title: process.env.GH_TITLE || "GoaT",
  contactName: process.env.GH_CONTACTNAME || "GoaT",
  contactEmail: process.env.GH_CONTACTEMAIL || "goat@genomehubs.org",
  url: GH_API_URL,
  memcached: process.env.GH_MEMCACHED || undefined,
  redis: process.env.GH_REDIS
    ? `${process.env.GH_REDIS}/${release.slice(-1)}`
    : undefined,
  treeThreshold: process.env.GH_TREE_THRESHOLD || 10000,
  scrollThreshold: process.env.GH_SCROLL_THRESHOLD || 10000,
};

export default config;
