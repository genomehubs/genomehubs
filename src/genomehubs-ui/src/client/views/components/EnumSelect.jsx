import BasicSelect from "./BasicSelect";
import React from "react";
import { compose } from "recompose";
import withTypes from "../hocs/withTypes";

const EnumSelect = ({ enumValues, types, ...props }) => {
  let values = "";
  if (
    types &&
    types[enumValues] &&
    types[enumValues].constraint &&
    types[enumValues].constraint.enum
  ) {
    let meta = types[enumValues].value_metadata || {};
    values = types[enumValues].constraint.enum.reduce((a, v) => {
      let k = meta[v] ? meta[v].description : v;
      return { ...a, [k]: v };
    }, {});
  }

  return <BasicSelect {...props} values={values} />;
};

export default compose(withTypes)(EnumSelect);
