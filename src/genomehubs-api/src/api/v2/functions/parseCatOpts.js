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
  let [field, count, values] = (cat || "").split(
    /\s*=*\s*\[([\d\+]+)\]\s*=*\s*/
  );
  if (!count) {
    [field, values] = (cat || "").split(/\s*=\s*/);
  }
  let catMeta = lookupTypes(field);
  let catOpts = `${typeof values === "undefined" ? "" : values};;${
    typeof count === "undefined" ? "" : count
  }`;
  return { cat: field, catMeta, query, catOpts };
};

export default parseCatOpts;
