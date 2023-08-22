import React from "react";
import { compose } from "recompose";
import withTypes from "../hocs/withTypes";

const TranslatedValue = ({ type, types, allTypes, text = "" }) => {
  if (
    types &&
    types[type] &&
    types[type].value_metadata &&
    types[type].value_metadata[text]
  ) {
    text = types[type].value_metadata[text].description || text;
  } else if (
    allTypes &&
    allTypes.taxon &&
    allTypes.taxon[type] &&
    allTypes.taxon[type].value_metadata &&
    allTypes.taxon[type].value_metadata[text]
  ) {
    text = allTypes.taxon[type].value_metadata[text].description || text;
  }
  if (text.match(/\(the/)) {
    let parts = text.split(/(?:\s*\(|\)\s*)/);
    let start = parts[1];
    parts[1] = parts[0];
    parts[0] = start;
    text = parts.join(" ").replace(/\s+$/, "");
  }

  return <span>{text}</span>;
};

export default compose(withTypes)(TranslatedValue);
