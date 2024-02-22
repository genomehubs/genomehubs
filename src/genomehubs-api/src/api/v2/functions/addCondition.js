import { operations } from "./operations";

export const addCondition = (
  conditions,
  parts,
  type,
  subset,
  summary = "value",
  fields,
  optionalFields
) => {
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

  if (subset) {
    conditions[stat][parts[2]].subset = subset;
  }

  let valueList = [];
  let includesNull = false;
  parts[4].split(",").forEach((value) => {
    if (value.match(/^null$/i)) {
      if (!parts[3].match(/^!/)) {
        includesNull = true;
      }
    } else if (!value.match(/^!null$/i)) {
      valueList.push(value.replaceAll("−", "-"));
    }
  });
  if (includesNull) {
    let fieldIndex = fields.indexOf(parts[2]);
    // if (valueList.length == 0) {
    if (fieldIndex >= 0) {
      fields.splice(fieldIndex, 1);
    }
    // }
    fieldIndex = optionalFields.indexOf(parts[2]);
    if (fieldIndex == -1) {
      optionalFields.push(parts[2]);
    }
  }
  if (valueList.length == 0) {
    return conditions;
  }

  if (
    stat == "keyword_value" ||
    stat == "flattened_value" ||
    (stat == "metadata" && !parts[3].match(/[><]/))
  ) {
    if (!Array.isArray(conditions[stat][parts[2]])) {
      conditions[stat][parts[2]] = [];
    }
    if (parts[3].match(/[><]/)) {
      let values = {};
      operations(parts[3]).forEach((operator) => {
        values[operator] = valueList.join(",");
      });
      conditions[stat][parts[2]].push(values);
    } else {
      if (parts[3] == "!=") {
        conditions[stat][parts[2]].push(
          valueList.map((term) => `!${term}`).join(",")
        );
      } else {
        conditions[stat][parts[2]].push(valueList.join(","));
      }
    }
  } else if (stat == "geo_point_value") {
    let [lat, lon] = valueList;
    conditions[stat][parts[2]] = {
      top_left: {
        lat: 1 * lat + 0.005,
        lon: lon - 0.005,
      },
      bottom_right: {
        lat: lat - 0.005,
        lon: 1 * lon + 0.005,
      },
    };
  } else {
    if (parts[3] == "==") {
      parts[3] = "=";
    }
    if (valueList.length == 0) {
      return conditions;
    }
    if (valueList[0] !== null && valueList[0].startsWith("!")) {
      valueList[0] = valueList[0].replace("!", "");
      parts[3] = `!${parts[3]}`;
    }
    operations(parts[3]).forEach((operator) => {
      conditions[stat][parts[2]][operator] = valueList.join(",");
    });
  }
  console.log(conditions);
  return conditions;
};
