import parseValue from "./parseValue";

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
    if (processed_type === "date" && isNaN(Date.parse(processedValue))) {
      return {
        valid: false,
        reason: `${v} is not a valid date, use yyyy-mm-dd format`,
      };
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

export const typesToValidation = (types) => {
  const validKeys = () => {
    let keys = new Set(["tax", "collate"]);
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
    let descriptions = {
      tax: "Taxonomic filter",
      collate: "Collate results by",
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
      descriptions[key] = obj.description || obj.display_name || key;
    }
    return {
      keys,
      keysByGroup,
      descriptions,
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

  const valueTips = ({ key, modifier }) => {
    if (key !== "tax" && key !== "constraint" && modifier !== "value") {
      return;
    }
    const { value_metadata: valueMeta = {} } = types[key] || {};
    if (Object.keys(valueMeta).length === 0) {
      return () => {};
    }
    return (val) => {
      let tip;
      let value = val.toLowerCase();
      if (valueMeta.hasOwnProperty(value) && valueMeta[value].description) {
        tip = valueMeta[value].description;
      } else if (
        valueMeta.hasOwnProperty("default") &&
        valueMeta.default.description
      ) {
        tip = valueMeta.default.description;
      }
      return tip.replace(/\W*click.*/i, "").trim();
    };
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
    if (key === "tax" || modifier === "collate") {
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
  const validateKey = ({ key }) => {
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
    if (value === null || value === undefined || value === "") {
      return { valid: true, processed_type };
    }
    if (["count", "length"].includes(modifier)) {
      processed_type = "integer";
    }
    let obj = { valid: true };
    if (["float", "integer", "date"].includes(processed_type)) {
      obj = validateNumber({ value, processed_type, constraint });
    } else if (processed_type.endsWith("keyword")) {
      obj = validateKeyword({
        value,
        validValues: validValues({ key, modifier }),
      });
    }
    return {
      valid: obj.valid,
      processed_type,
      reason: obj.valid ? null : obj.reason,
    };
  };
  const validateModifier = ({ key, modifier }) => {
    if (modifier === "collate") {
      return { valid: true };
    }
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
    if (modifier === "collate") {
      return false;
    }
    if (modifier !== "value") {
      return false;
    }
    const { processed_type } = types[key] || {};
    if (
      processed_type === "integer" ||
      processed_type === "float" ||
      processed_type === "date"
    ) {
      return false;
    }
    return true;
  };

  const allowSplitValues = ({ key, modifier }) => {
    if (key === "tax") {
      return false;
    }
    const { processed_type } = types[key] || {};
    if (processed_type === "ordered_keyword") {
      return false;
    }
    return allowMultipleValues({ key, modifier }) && modifier === "value";
  };

  const isNegatable = ({ key, modifier }) => {
    if (key === "tax") {
      if (["tree", "name", "eq"].includes(modifier)) {
        return true;
      }
      return false;
    }
    if (modifier === "collate") {
      return false;
    }
    const { processed_type } = types[key] || {};
    if (
      processed_type === "integer" ||
      processed_type === "float" ||
      processed_type === "date" ||
      modifier === "length" ||
      modifier === "count"
    ) {
      return false;
    }
    return true;
  };

  const getOperatorDescription = (operator) => {
    switch (operator) {
      case "=":
        return "is equal to";
      case "!=":
        return "is not equal to";
      case ">":
        return "is greater than";
      case "<":
        return "is less than";
      case ">=":
        return "is greater than or equal to";
      case "<=":
        return "is less than or equal to";
      default:
        return "unknown operator";
    }
  };

  const modifierDescriptions = {
    tree: "Show descendant nodes for taxon",
    name: "Show taxon only",
    rank: "Restrict to taxonomic rank",
    lineage: "Search in taxonomic lineage",
    level: "Restrict to numeric level of descendant nodes",
    eq: "Show taxon only",
    value: "Field value",
    length: "Length of a value list",
    direct: "Restrict to directly measured values",
    ancestor: "Restrict to values from ancestor nodes",
    descendant: "Restrict to values from descendant nodes",
    max: "Maximum value",
    min: "Minimum value",
    mean: "Mean value",
    sum: "Sum of values",
    median: "Median value",
    mode: "Mode of values",
    count: "Count of items",
  };

  const getModifierDescription = (modifier) => {
    if (modifierDescriptions.hasOwnProperty(modifier)) {
      return modifierDescriptions[modifier];
    }
    return "unknown modifier";
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
    valueTips,
    allowMultipleValues,
    allowSplitValues,
    isNegatable,
    getOperatorDescription,
    getModifierDescription,
  };
};

export default typesToValidation;
