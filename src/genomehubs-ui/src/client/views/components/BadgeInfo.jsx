import AggregationIcon from "./AggregationIcon";
import React from "react";
import { compose } from "recompose";
import formatter from "../functions/formatter";
import styles from "./Styles.scss";
import withTypes from "../hocs/withTypes";

export const BadgeInfo = ({
  currentRecord,
  currentRecordId,
  scientificName,
  taxonomy,
  result,
  rank,
  types,
}) => {
  let fields = Object.entries(types)
    .filter(([_, v]) => v.display_level == 1)
    .map(([k]) => k);
  fields.push("long_list");
  let divs = fields.map((k) => {
    let meta = types[k];
    let field = currentRecord.record.attributes[k];
    if (!field || !field.hasOwnProperty("value")) {
      return null;
    }
    let { value } = field;

    if (Array.isArray(value)) {
      if (value.length == 0) {
        return null;
      }
      value = formatter(value, result, "array");
      let charLimit = 20;
      let entries = [];
      for (let v of value.values) {
        let entry = v[0];
        if (charLimit == 20 || charLimit - entry.length > 0) {
          entries.push(entry);
          charLimit -= entry.length;
        }
      }
      value = entries.join(",");
      if (field.value.length > 1) {
        length = field.value.length;
        if (field.value.length > entries.length) {
          value += ", ...";
        }
      }
    } else {
      value = formatter(value);
    }

    return (
      <div className={styles.badgeInfo} key={k}>
        <div className={styles.infoName}>{meta.display_name || k}</div>
        <AggregationIcon
          method={field.aggregation_source}
          hasDescendants={field.has_descendants}
        />
        <div className={styles.infoValue}>{value}</div>
      </div>
    );
  });

  return <div>{divs}</div>;
};

export default compose(withTypes)(BadgeInfo);
