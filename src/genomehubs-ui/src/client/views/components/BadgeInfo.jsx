import {
  badgeInfoMore as badgeInfoMoreStyle,
  badgeInfoSelected as badgeInfoSelectedStyle,
  badgeInfo as badgeInfoStyle,
  infoName as infoNameStyle,
  infoValue as infoValueStyle,
} from "./Styles.scss";

import AggregationIcon from "./AggregationIcon";
import Tooltip from "./Tooltip";
import classNames from "classnames";
import { compose } from "redux";
import formatter from "#functions/formatter";
import useNavigate from "#hooks/useNavigate";
import withSiteName from "#hocs/withSiteName";
import withTaxonomy from "#hocs/withTaxonomy";
import withTypes from "#hocs/withTypes";

export const BadgeInfoCell = ({
  fieldName,
  field,
  result,
  handleClick = () => {},
  tipTitle,
  selected,
}) => {
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

  let css = badgeInfoStyle;
  if (selected) {
    css = classNames(badgeInfoStyle, badgeInfoSelectedStyle);
  }

  return (
    <Tooltip title={tipTitle} placement={"top"} arrow>
      <div className={css} onClick={handleClick}>
        <div className={infoNameStyle}>{fieldName}</div>
        <AggregationIcon
          method={field.aggregation_source}
          hasDescendants={field.has_descendants}
        />
        <div className={infoValueStyle}>{value}</div>
      </div>
    </Tooltip>
  );
};

export const BadgeInfo = ({
  currentRecord,
  currentRecordId,
  scientificName,
  taxonId,
  setBrowse,
  taxonomy,
  result,
  rank,
  fieldName,
  setFieldName,
  basename,
  types,
}) => {
  const navigate = useNavigate();
  const moreInfo = () => {
    navigate(
      `record?recordId=${currentRecordId}&result=${result}&taxonomy=${taxonomy}`,
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
    return (
      <BadgeInfoCell
        {...{
          field,
          fieldName: k,
          key: k,
          result,
          tipTitle: `Click to ${
            fieldName == k ? "remove" : "show"
          } ${k} labels`,
          handleClick: (e) => {
            setFieldName(k == fieldName ? undefined : k);
          },
          selected: k == fieldName,
        }}
      />
    );
  });

  return (
    <>
      {divs}
      <div className={badgeInfoMoreStyle}>
        <Tooltip title={"Click to view full record"} placement={"top"} arrow>
          <a onClick={moreInfo}>more...</a>
        </Tooltip>
      </div>
    </>
  );
};

export default compose(withSiteName, withTaxonomy, withTypes)(BadgeInfo);
