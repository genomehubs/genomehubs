import { operations } from "./operations";

export const addCondition = (conditions, parts, type, summary = "value") => {
  if (!conditions) {
    conditions = {};
  }
  let stat = summary;
  if (parts[1] && parts[1].length > 0) {
    stat = parts[1];
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
  parts[2] = parts[2].toLowerCase();
  if (!conditions[stat][parts[2]]) {
    if (stat == "keyword_value") {
      conditions[stat][parts[2]] = [];
    } else {
      conditions[stat][parts[2]] = {};
    }
  }

  if (stat == "keyword_value") {
    if (parts[3].match(/[><]/)) {
      let values = {};
      operations(parts[3]).forEach((operator) => {
        values[operator] = parts[4];
      });
      conditions[stat][parts[2]].push(values);
    } else {
      if (parts[3] == "!=") {
        conditions[stat][parts[2]].push(
          parts[4]
            .split(",")
            .map((term) => `!${term}`)
            .join(",")
        );
      } else {
        conditions[stat][parts[2]].push(parts[4]);
      }
    }
  } else {
    if (parts[3] == "==") {
      parts[3] = "=";
    }
    if (parts[4].startsWith("!")) {
      parts[4] = parts[4].replace("!", "");
      parts[3] = `!${parts[3]}`;
    }
    operations(parts[3]).forEach((operator) => {
      conditions[stat][parts[2]][operator] = parts[4];
    });
  }
  return conditions;
};
