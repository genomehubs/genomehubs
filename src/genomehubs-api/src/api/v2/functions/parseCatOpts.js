export const parseCatOpts = ({ cat, query, lookupTypes }) => {
  // splits cat and opts
  // examples:
  // input: cat = "c_value_method"
  // output: cat = "c_value_method"
  //         catOpts = ";;"
  //
  // input: cat = "c_value_method=flow cytometry"
  // output: cat = "c_value_method"
  //         catOpts = "flow cytometry;;"
  //
  // input: cat = "c_value_method[12]"
  // output: cat = "c_value_method"
  //         catOpts = ";;12"
  //
  // input: cat = "c_value_method[5+]"
  // output: cat = "c_value_method"
  //         catOpts = ";;5+"
  //
  // input: cat = "c_value_method[5+]=flow cytometry"
  // output: cat = "c_value_method"
  //         catOpts = "flow cytometry;;5+"
  //
  // input: cat = "c_value_method[5+]=flow cytometry,null"
  // output: cat = "c_value_method"
  //         catOpts = "flow cytometry,null;;5+"
  //
  // input: cat = "c_value_method[5+]=flow cytometry,null,feulgen densitometry"
  // output: cat = "c_value_method"
  //         catOpts = "flow cytometry,null,feulgen densitometry;;5+"
  let [field, count, values] = (cat || "").split(/=*\[([\d\+]+)\]=*/);
  let catMeta = lookupTypes(field);
  let catOpts = `${typeof values === "undefined" ? "" : values};;${
    typeof count === "undefined" ? "" : count
  }`;
  return { cat: field, catMeta, query, catOpts };
};

const oldParseCatOpts = ({ cat, query, lookupTypes }) => {
  let catOpts = ";;";
  let portions = (cat || "").split(/\s*[\[\]]\s*/);
  cat = portions[0];
  let catMeta = lookupTypes(portions[0]);
  if (portions.length > 1) {
    // check if opts are set and update query
    if (portions[1].match(/[,;]/)) {
      catOpts = portions[1];
      let queryArr = (query || "").split(/(\s*[<>=]+\s*|\s+AND\s+|\s+and\s+)/);
      let options = portions[1].split(";");
      if (options.length == 1) {
        options = options[0].split(",");
      }
      let min, max;
      if (typeof options[0] !== "undefined") {
        min = options[0];
      }
      if (typeof options[1] !== "undefined") {
        max = options[1];
      }
      for (let i = 0; i < queryArr.length; i++) {
        let qMeta = lookupTypes(queryArr[i].toLowerCase());
        if (qMeta && qMeta.name == portions[0]) {
          i++;
          if (min && queryArr[i] && queryArr[i].match(/</)) {
            i++;
            if (
              queryArr[i] &&
              !Number.isNaN(queryArr[i]) &&
              min > queryArr[i]
            ) {
              queryArr[i] = min;
              min = undefined;
            }
          } else if (max && queryArr[i] && queryArr[i].match(/>/)) {
            i++;
            if (
              queryArr[i] &&
              !Number.isNaN(queryArr[i]) &&
              max < queryArr[i]
            ) {
              queryArr[i] = max;
              max = undefined;
            }
          }
        }
      }
      if (min || max) {
        queryArr = queryArr.concat([" AND ", portions[0], " >= ", min]);
        if (max) {
          queryArr = queryArr.concat([" AND ", portions[0], " <= ", max]);
        }
      } else {
        // queryArr = queryArr.concat([" AND ", portions[0]]);
      }
      searchFields.push(portions[0]);

      query = queryArr.join("");
    } else {
      catOpts = `;;${portions[1]}`;
    }
    delete portions[1];
    cat = portions.join("");
  }
  cat = "c_value_method";
  catOpts = "flow cytometry,null,feulgen densitometry;;5+";
  return { cat, catMeta, query, catOpts };
};

export default parseCatOpts;
