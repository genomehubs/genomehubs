export const filterProperties = (properties) => {
  if (Object.keys(properties).length == 0) {
    return [];
  }
  let rangeQuery = (field, stat) => {
    if (
      stat != "keyword_value" &&
      typeof properties[stat][field] === "object"
    ) {
      return {
        range: {
          [field]: properties[stat][field],
        },
      };
    } else {
      return {
        match: {
          [field]: properties[stat][field][0],
        },
      };
    }
  };
  if (Object.keys(properties).length == 0) {
    return [];
  }
  let arr = [];
  Object.keys(properties).forEach((stat) => {
    let subset = Object.keys(properties[stat]).map((field) =>
      rangeQuery(field, stat)
    );
    arr.push(...subset);
  });
  return arr;
};
