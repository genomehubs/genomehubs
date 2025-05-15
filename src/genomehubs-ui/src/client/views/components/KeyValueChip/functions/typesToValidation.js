import parseValue from "./parseValue";
import types from "./default.types.json";

const validateNumber = ({ value, processed_type, constraint }) => {
  let values = Array.isArray(value) ? value : [value];
  for (let v of values) {
    let processedValue = parseValue(v);
    if (processed_type === "integer" && !Number.isInteger(processedValue)) {
      return { valid: false, reason: `${v} is not an integer` };
    }
    if (processed_type === "float" && typeof processedValue !== "number") {
      return { valid: false, reason: `${v} is not a number` };
    }
    if (constraint.hasOwnProperty("min") && processedValue < constraint.min) {
      return { valid: false, reason: `${v} is less than ${constraint.min}` };
    }
    if (constraint.hasOwnProperty("max") && processedValue > constraint.max) {
      return { valid: false, reason: `${v} greater than ${constraint.max}` };
    }
  }
  return { valid: true };
};

const validateKeyword = ({ value, validValues }) => {
  if (validValues) {
    let values;
    if (!Array.isArray(value)) {
      if (typeof value === "string") {
        values = value.split(/\s*,\s*/);
      } else {
        values = [value];
      }
    } else {
      values = value;
    }
    for (let v of values) {
      if (!validValues.has(v.replace(/^!/, "").toLowerCase())) {
        return { valid: false, reason: `${v} is not a valid value` };
      }
    }
  }
  return { valid: true };
};

export const typesToValidation = () => {
  const validKeys = () => {
    let keys = new Set(["tax"]);
    let keysByGroup = {
      primary: new Set(["tax_tree", "tax_name", "tax_rank"]),
      tax: new Set([
        "tax_tree",
        "tax_name",
        "tax_rank",
        "tax_lineage",
        "tax_level",
        "tax_eq",
      ]),
    };
    for (let [key, obj] of Object.entries(types)) {
      keys.add(key);
      if (obj.display_level == 1) {
        keysByGroup.primary.add(key);
      }
      let { display_group } = obj;
      if (!keysByGroup.hasOwnProperty(display_group)) {
        keysByGroup[display_group] = new Set();
      }
      keysByGroup[display_group].add(key);
    }
    return {
      keys,
      keysByGroup,
    };
  };

  const validValues = ({ key, modifier }) => {
    if (key !== "tax" && key !== "constraint" && modifier !== "value") {
      return;
    }
    const { constraint = {} } = types[key] || {};
    if (constraint.hasOwnProperty("enum")) {
      let values = new Set(constraint.enum.map((v) => v.toLowerCase()));
      values.add("null");
      return values;
    }
    return;
  };

  const validModifiers = (key) => {
    if (key === "tax") {
      return new Set(["tree", "name", "rank", "lineage", "level", "eq"]);
    }
    const { summary = [], traverse_direction } = types[key] || {};
    let modifiers = new Set(["value"]);
    for (let modifier of Array.isArray(summary) ? summary : [summary]) {
      if (modifier === "primary") {
        continue;
      }
      if (modifier === "list") {
        modifiers.add("length");
        continue;
      }
      if (modifier.match(/\w+_\w+/)) {
        let [mod] = modifier.split("_");

        modifiers.add(mod);
      } else {
        modifiers.add(modifier);
      }
    }
    if (traverse_direction) {
      modifiers.add("direct");
      if (traverse_direction === "up") {
        modifiers.add("descendant");
      }
      if (traverse_direction === "down" || traverse_direction === "both") {
        modifiers.add("ancestor");
      }
    }
    return modifiers;
  };

  const validOperators = ({ key, modifier }) => {
    if (key === "tax" || key === "collate") {
      return new Set([]);
    }
    const { processed_type, summary = [] } = types[key] || {};
    let operators = new Set(["=", "!="]);
    if (processed_type !== "keyword" || modifier !== "value") {
      operators.add(">");
      operators.add("<");
      operators.add(">=");
      operators.add("<=");
    }
    return operators;
  };
  const validateKey = (key) => {
    if (validKeys().keys.has(key)) {
      let color = "blue";
      if (key === "tax") {
        color = "purple";
      } else if (key === "collate") {
        color = "green";
      }
      return { valid: true, color };
    }
    return { valid: false, reason: "not a valid key" };
  };
  const validateValue = ({ key, value, modifier }) => {
    let { constraint = {}, processed_type = "" } = types[key] || {};
    if (["float", "integer"].includes(processed_type)) {
      return validateNumber({ value, processed_type, constraint });
    } else if (processed_type.endsWith("keyword")) {
      return validateKeyword({
        value,
        validValues: validValues({ key, modifier }),
      });
    }
    return { valid: true };
  };
  const validateModifier = ({ key, modifier }) => {
    const modifiers = validModifiers(key);
    if (modifiers.has(modifier)) {
      return { valid: true };
    }
    return { valid: false, reason: "not a valid modifier" };
  };
  const validateOperator = ({ key, modifier = "value", operator }) => {
    const operators = validOperators({ key, modifier });
    if (!operator || operators.has(operator)) {
      return { valid: true };
    }
    return { valid: false, reason: "not a valid operator" };
  };

  const allowMultipleValues = ({ key, modifier }) => {
    if (key === "tax") {
      return true;
    }
    if (key === "collate") {
      return false;
    }
    if (modifier !== "value") {
      return false;
    }
    const { processed_type } = types[key] || {};
    if (
      processed_type === "integer" ||
      processed_type === "float" ||
      processed_type === "keyword"
    ) {
      return false;
    }
    return true;
  };

  return {
    validKeys,
    validateKey,
    validValues,
    validateValue,
    validModifiers,
    validateModifier,
    validOperators,
    validateOperator,
    allowMultipleValues,
  };
};

export default typesToValidation;
