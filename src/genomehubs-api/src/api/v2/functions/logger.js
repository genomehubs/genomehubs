import "winston-daily-rotate-file";

import { createLogger, format, transports } from "winston";

import { config } from "./config";

const { combine, timestamp, prettyPrint, colorize, errors, label, printf } =
  format;

const errorTransport = new transports.DailyRotateFile({
  filename: config.errorLog,
  level: "error",
  format: combine(
    errors({ stack: true }),
    colorize(),
    timestamp(),
    prettyPrint()
  ),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

const accessTransport = new transports.DailyRotateFile({
  filename: config.accessLog,
  format: format.simple(),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

const memcacheTransport = new transports.DailyRotateFile({
  filename: config.memcacheLog,
  format: combine(timestamp(), prettyPrint()),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
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
  let { url, method, httpVersion, headers } = req;

  logger.info({
    url,
    method,
    httpVersion,
    host: headers.host,
    code,
    size,
    referrer: undefined,
    userAgent: headers["user-agent"],
  });
};

export const logMemcache = function ({ key, action, success }) {
  logger.info({ action, key, success });
  //   `${timestamp()} ${action} - ${key} - ${success ? "TRUE" : "FALSE"}`
  // );
};

export default logger;
