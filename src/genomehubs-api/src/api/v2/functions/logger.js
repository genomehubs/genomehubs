import "winston-daily-rotate-file";

import { createLogger, format, transports } from "winston";

import { config } from "./config";

const { combine, timestamp, prettyPrint, colorize, errors } = format;

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
  format: combine(colorize(), timestamp(), prettyPrint()),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

const logger = createLogger({
  transports: [errorTransport, accessTransport],
});

// if (process.env.NODE_ENV !== "production") {
//   logger.add(
//     new winston.transports.Console({
//       format: winston.format.json(),
//     })
//   );
// }

export default logger;
