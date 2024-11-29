import {
  timeDay,
  timeHour,
  timeMinute,
  timeMonth,
  timeSecond,
  timeWeek,
  timeYear,
} from "d3-time";

import { format } from "d3-format";
import { utcFormat } from "d3-time-format";

const sci = (v) => {
  if (v < 1000 && v >= 0.001) {
    if (v < 10) {
      return format(".3r")(v).replace(/0*$/, "");
    }
    return format(".3r")(v);
  }
  return format(".3s")(v);
};
const sciInt = (v) => {
  if (v < 1000) {
    return Math.ceil(v);
  }
  return format(".3s")(v);
};

const formatMillisecond = utcFormat(".%L"),
  formatSecond = utcFormat(":%S"),
  formatMinute = utcFormat("%I:%M"),
  formatHour = utcFormat("%I %p"),
  formatDay = utcFormat("%a %d"),
  formatWeek = utcFormat("%b %d"),
  formatMonth = utcFormat("%b"),
  formatMonthDecimal = utcFormat("%m"),
  formatMonthYear = utcFormat("%b %Y"),
  formatYear = utcFormat("%Y");

const timeFormats = {
  millisecond: formatMillisecond,
  second: formatSecond,
  minute: formatMinute,
  hour: formatHour,
  day: formatDay,
  week: formatWeek,
  // month: formatMonth,
  month: (date) =>
    formatMonthDecimal(date) == "01"
      ? formatMonthYear(date)
      : formatMonth(date),
  year: formatYear,
};

export const setInterval = (diff, bins) => {
  let interval = diff / bins;
  return interval < 1000
    ? "millisecond"
    : interval < 60000
      ? "second"
      : interval < 3600000
        ? "minute"
        : interval < 86400000
          ? "hour"
          : interval < 604800000
            ? "day"
            : interval < 2628000000
              ? "week"
              : interval < 31535965000
                ? "month"
                : "year";
};

function multiFormat(date, interval) {
  if (interval) {
    return timeFormats[interval](date);
  }
  return (
    timeSecond(date) < date
      ? formatMillisecond
      : timeMinute(date) < date
        ? formatSecond
        : timeHour(date) < date
          ? formatMinute
          : timeDay(date) < date
            ? formatHour
            : timeMonth(date) < date
              ? timeWeek(date) < date
                ? formatDay
                : formatWeek
              : timeYear(date) < date
                ? formatMonth
                : formatYear
  )(date);
}

export const formats = (value, valueType, interval) => {
  if (
    value == "..." ||
    isNaN(value) ||
    valueType == "keyword" ||
    valueType == "coordinate"
  ) {
    return value;
  }
  if (valueType == "integer") {
    return sciInt(value);
  } else if (valueType == "date") {
    return multiFormat(value, interval);
  }
  return sci(value);
};

export default formats;
