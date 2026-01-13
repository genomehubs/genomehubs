import BasicSelect from "./BasicSelect";
import React from "react";
import { compose } from "redux";
import withTypes from "#hocs/withTypes";

const EnumSelect = ({ enumValues, types, allTypes, ...props }) => {
  let values = "";
  let meta = {};
  let enumerator;
  if (
    types &&
    types[enumValues] &&
    types[enumValues].constraint &&
    types[enumValues].constraint.enum
  ) {
    meta = types[enumValues].value_metadata || {};
    enumerator = types[enumValues].constraint.enum;
  } else if (
    allTypes &&
    allTypes.taxon &&
    allTypes.taxon[enumValues] &&
    allTypes.taxon[enumValues].constraint &&
    allTypes.taxon[enumValues].constraint.enum
  ) {
    meta = allTypes.taxon[enumValues].value_metadata || {};
    enumerator = allTypes.taxon[enumValues].constraint.enum;
  }

  if (enumerator) {
    values = enumerator.reduce((a, v) => {
      let k = meta[v] ? meta[v].description : v;
      return { ...a, [k]: v };
    }, {});
  }

  return <BasicSelect {...props} values={values} />;
};

export default compose(withTypes)(EnumSelect);
