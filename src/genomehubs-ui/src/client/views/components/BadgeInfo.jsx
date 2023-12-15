import { useLocation, useNavigate } from "@reach/router";

import AggregationIcon from "./AggregationIcon";
import React from "react";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import formatter from "../functions/formatter";
import styles from "./Styles.scss";
import withSiteName from "../hocs/withSiteName";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

export const BadgeInfo = ({
  currentRecord,
  currentRecordId,
  scientificName,
  taxonId,
  setBrowse,
  taxonomy,
  result,
  rank,
  basename,
  types,
}) => {
  const navigate = useNavigate();
  const moreInfo = () => {
    navigate(
      `${basename}/record?recordId=${currentRecordId}&result=${result}&taxonomy=${taxonomy}`
    );
    setBrowse();
  };
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

    let fieldName = k;

    return (
      <Tooltip
        title={`Click to search ${fieldName} values for ${scientificName}`}
        placement={"top"}
        arrow
        key={k}
      >
        <div
          className={styles.badgeInfo}
          onClick={() => {
            navigate(
              `${basename}/search?query=tax_tree%28${scientificName}%5B${taxonId}%5D%29%20AND%20${k}&fields=${k}&includeEstimates=false&taxonomy=${taxonomy}&result=${result}`
            );

            setBrowse();
          }}
        >
          <div className={styles.infoName}>{fieldName}</div>
          <AggregationIcon
            method={field.aggregation_source}
            hasDescendants={field.has_descendants}
          />
          <div className={styles.infoValue}>{value}</div>
        </div>
      </Tooltip>
    );
  });

  return (
    <>
      {divs}
      <div className={styles.badgeInfoMore}>
        <Tooltip title={"Click to view full record"} placement={"top"} arrow>
          <a onClick={moreInfo}>more...</a>
        </Tooltip>
      </div>
    </>
  );
};

export default compose(withSiteName, withTaxonomy, withTypes)(BadgeInfo);
