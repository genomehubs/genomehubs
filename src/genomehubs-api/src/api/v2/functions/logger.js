import "winston-daily-rotate-file";

import { createLogger, format, transports } from "winston";

import { config } from "./config";

const { combine, timestamp, prettyPrint, colorize, errors, label, printf } =
  format;

const accessFormat = printf(({ level, message }) => {
  const timeISOString = new Date(Date.now()).toISOString();
  return `${message.host} - - ${timeISOString} "${message.method} ${
    message.url
  } HTTP/${message.httpVersion}" ${message.code || "-"} ${
    message.size || "-"
  } ${message.referrer || "-"} ${message.userAgent || "-"}`;
});

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

export const logger = createLogger({
  transports: [errorTransport, accessTransport],
});

// if (process.env.NODE_ENV !== "production") {
//   logger.add(
//     new winston.transports.Console({
//       format: winston.format.json(),
//     })
//   );
// }

export const logError = ({ req, message }) => {
  let { url, method, httpVersion, headers } = req;
  logger.error({
    url,
    method,
    httpVersion,
    host: headers.host,
    userAgent: headers["user-agent"],
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

export default logger;
