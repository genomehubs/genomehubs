import { operations } from "./operations";

export const addCondition = (conditions, parts, type, summary = "value") => {
  if (!conditions) {
    conditions = {};
  }
  let segments = parts[0].split(/[\(\)]/);
  let stat = summary;
  if (segments.length > 1) {
    stat = segments[0];
    parts[0] = segments[1];
  }
  if (stat) {
    if (type == "date") {
      stat = stat == "min" ? "from" : stat == "max" ? "to" : stat;
    }
  }
  if (stat == "value") {
    stat = `${type}_value`;
  }
  if (!conditions[stat]) {
    conditions[stat] = {};
  }
  parts[0] = parts[0].toLowerCase();
  if (!conditions[stat][parts[0]]) {
    if (stat == "keyword_value") {
      conditions[stat][parts[0]] = [];
    } else {
      conditions[stat][parts[0]] = {};
    }
  }

  if (stat == "keyword_value") {
    if (parts[1].match(/[><]/)) {
      let values = {};
      operations(parts[1]).forEach((operator) => {
        values[operator] = parts[2];
      });
      conditions[stat][parts[0]].push(values);
    } else {
      if (parts[1] == "!=") {
        conditions[stat][parts[0]].push(
          parts[2]
            .split(",")
            .map((term) => `!${term}`)
            .join(",")
        );
      } else {
        conditions[stat][parts[0]].push(parts[2]);
      }
    }
  } else {
    if (parts[1] == "==") {
      parts[1] = "=";
    }
    if (parts[2].startsWith("!")) {
      parts[2] = parts[2].replace("!", "");
      parts[1] = `!${parts[1]}`;
    }
    operations(parts[1]).forEach((operator) => {
      conditions[stat][parts[0]][operator] = parts[2];
    });
  }

  return conditions;
};
