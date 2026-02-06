export const expandFieldList = ({ fields, types }) => {
  let fieldList = [];
  for (let field of fields.split(",")) {
    if (!field || field.trim() === "") {
      continue;
    }
    if (field.match(/\*/)) {
      let parts = field.split(/\*/);
      let starts = parts[0] > "" && parts[0];
      let ends = parts[1] > "" && parts[1];
      for (let fieldName of Object.keys(types)) {
        if (starts && !fieldName.startsWith(starts)) {
          continue;
        }
        if (ends && !fieldName.endsWith(ends)) {
          continue;
        }
        fieldList.push(fieldName);
      }
    } else if (field != "all") {
      fieldList.push(field);
    }
  }
  if (fields == "all") {
    fieldList = Object.entries(types)
      .filter(([key, obj]) => obj.display_level == 1)
      .map(([key]) => key);
  }
  return fieldList;
};

export default expandFieldList;
