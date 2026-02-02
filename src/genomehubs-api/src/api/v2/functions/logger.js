import "winston-daily-rotate-file";

import { createLogger, format, transports } from "winston";

import { config } from "./config.js";

const { combine, timestamp, prettyPrint, colorize, errors, label, printf } =
  format;

const errorTransport = new transports.DailyRotateFile({
  filename: config.errorLog,
  level: "error",
  format: combine(
    errors({ stack: true }),
    colorize(),
    timestamp(),
    prettyPrint(),
  ),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

errorTransport.on("error", (error) => {
  console.log("errorTransport", error);
});

const accessTransport = new transports.DailyRotateFile({
  filename: config.accessLog,
  format: combine(
    timestamp(),
    printf((info) => {
      let msg = info.message;
      try {
        if (msg && typeof msg === "object") {
          msg = JSON.stringify(msg);
        }
      } catch (e) {
        try {
          // fallback to util.inspect for circular objects
          // require here to avoid top-level dependency if not needed
          const util = require("util");
          msg = util.inspect(info.message, { depth: 5 });
        } catch (e2) {
          msg = String(info.message);
        }
      }
      return `${info.level}: ${[info.timestamp]}: ${msg}`;
    }),
  ),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

accessTransport.on("error", (error) => {
  console.log("accessTransport", error);
});

const memcacheTransport = new transports.DailyRotateFile({
  filename: config.memcacheLog,
  format: combine(timestamp(), prettyPrint()),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

memcacheTransport.on("error", (error) => {
  console.log("memcacheTransport", error);
});

export const logger = createLogger({
  transports: [errorTransport, accessTransport, memcacheTransport],
});

// if (process.env.NODE_ENV !== "production") {
//   logger.add(
//     new winston.transports.Console({
//       format: winston.format.json(),
//     })
//   );
// }

export const logError = ({ req, message }) => {
  let url, method, httpVersion, headers;
  if (req) {
    ({ url, method, httpVersion, headers } = req);
  }
  logger.error({
    url,
    method,
    httpVersion,
    ...(headers && { host: headers.host, userAgent: headers["user-agent"] }),
    message,
  });
};

export const logAccess = function ({ req, code, size }) {
  let url, method, httpVersion, headers;
  if (req) {
    ({ url, method, httpVersion, headers } = req);
  }

  logger.info({
    message: `${url} ${method} ${httpVersion} ${headers.host} ${headers["user-agent"]}`,
  });
};

export const logMemcache = function ({ key, action, success }) {
  logger.info({ action, key, success });
  //   `${timestamp()} ${action} - ${key} - ${success ? "TRUE" : "FALSE"}`
  // );
};

export default logger;
