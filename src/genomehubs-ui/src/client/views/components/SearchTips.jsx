import {
  header as headerStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  textPanel as resultPanelStyle,
  title as titleStyle,
} from "./Styles.scss";

import ColorButton from "./ColorButton";
import React from "react";
import Tooltip from "./Tooltip";
import classnames from "classnames";
import { compose } from "redux";
import didYouMean from "didyoumean2";
import qs from "../functions/qs";
import setColors from "../functions/setColors";
import { useLocation } from "@reach/router";
import useNavigate from "../hooks/useNavigate";
import withColors from "#hocs/withColors";
import withSearch from "../hocs/withSearch";
import withTypes from "../hocs/withTypes";

const Suggestion = ({ title, description, options, colors }) => {
  const navigate = useNavigate();
  const newSearch = qs.stringify(options);
  return (
    <div
      style={{
        position: "relative",
        maxWidth: "50em",
        border: `solid 2px ${colors[0]}99`,
        borderRadius: "0.5em",
        padding: "1em",
        margin: "1em",
        marginLeft: "0",
      }}
    >
      <div style={{ float: "right" }}>
        <ColorButton
          onClick={(e) => {
            e.preventDefault();
            navigate(`?${newSearch}`);
          }}
        >
          Apply to search
        </ColorButton>
      </div>
      <h3 style={{ marginTop: "0.5em" }}>{title}</h3>

      <div>
        <i>{description}</i>
      </div>
    </div>
  );
};

const SearchTips = ({
  attributes,
  taxonId,
  searchIndex,
  title = "Attributes",
  types,
  colors,
  levels,
  colorPalette,
  palettes,
}) => {
  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle); //= classnames(infoPanelStyle, infoPanel1ColumnStyle, resultPanelStyle);

  const location = useLocation();
  const navigate = useNavigate();
  const fuzzyOpts = {
    threshold: 0.8,
  };
  let options = qs.parse(location.search.replace(/^\?/, ""));
  if (!options.query) {
    return null;
  }
  if (options.result != searchIndex) {
    return null;
  }

  ({ levels, colors } = setColors({
    colorPalette,
    palettes,
    levels,
    count: 5,
    colors,
  }));
  let queryParts = options.query.split(/\s+(?:AND)\s+/i);
  let suggestions = [];
  let invalidTerm = false;
  for (let i = 0; i < queryParts.length; i++) {
    if (
      queryParts[i].match(/tax_name/) &&
      (options.result == "assembly" || options.query.match("tax_rank"))
    ) {
      suggestions.push(
        <Suggestion
          key={"replace_tax_name"}
          title="Replace 'tax_name()' with 'tax_tree()'"
          description="Use 'tax_tree()' to include descendant taxa"
          options={{
            ...options,
            query: queryParts
              .with(i, queryParts[i].replace("tax_name", "tax_tree"))
              .join(" AND "),
          }}
          colors={colors}
        />,
      );
    } else if (
      options.result == "assembly" &&
      queryParts[i].match(/tax_rank/) &&
      !queryParts[i].match(/\((subspecies|species)\)/)
    ) {
      let newParts = [...queryParts];
      newParts.splice(i, 1);
      suggestions.push(
        <Suggestion
          key={"remove_tax_rank"}
          title={`Remove ${queryParts[i]}`}
          description="The assembly index only contains results at 'tax_rank(species)' and 'tax_rank(subspecies)'"
          options={{
            ...options,
            query: newParts.join(" AND "),
          }}
          colors={colors}
        />,
      );
    } else if (!queryParts[i].match(/tax_\w+\(/)) {
      let [key, value] = queryParts[i].split(/\s*[<>!=]\s*/);
      key = key.replace("!", "");
      if (!types.hasOwnProperty(key) && !key.match(/^\w+_id$/)) {
        let valid_keys = didYouMean(key, Object.keys(types), fuzzyOpts) || [];
        if (typeof valid_keys == "string") {
          valid_keys = [valid_keys];
        }
        for (let valid_key of valid_keys) {
          let validParts = [...queryParts];
          validParts[i] = validParts[i].replace(key, valid_key);
          suggestions.push(
            <Suggestion
              key={`replace_${key}_${valid_key}`}
              title={`Replace '${key}' with '${valid_key}'`}
              description={`'${key}' is not a valid attribute for the ${options.result} index, did you mean '${valid_key}'?`}
              options={{
                ...options,
                query: validParts.join(" AND "),
              }}
              colors={colors}
            />,
          );
        }
        let newParts = [...queryParts];
        newParts.splice(i, 1);
        invalidTerm = true;
        suggestions.push(
          <Suggestion
            key={`remove_${key}_${i}`}
            title={`Remove '${queryParts[i]}'`}
            description={`'${key}' is not a valid attribute for the ${options.result} index`}
            options={{
              ...options,
              query: newParts.join(" AND "),
            }}
            colors={colors}
          />,
        );
      } else if (value && types[key]?.constraint?.enum) {
        for (let v of value.split(/\s*,\s*/)) {
          v = v.replace(/['"!]/g, "");
          if (!types[key].constraint.enum.includes(v.toLowerCase())) {
            let valid_values = didYouMean(
              v,
              types[key].constraint.enum,
              fuzzyOpts,
            );
            if (typeof valid_values == "string") {
              valid_values = [valid_values];
            } else if (!Array.isArray(valid_values)) {
              continue;
            }
            for (let valid_value of valid_values) {
              let validParts = [...queryParts];
              validParts[i] = validParts[i].replace(v, valid_value);
              suggestions.push(
                <Suggestion
                  key={`replace_${key}_${value}_${valid_value}`}
                  title={`Replace '${v}' with '${valid_value}' for '${key}'`}
                  description={`'${v}' is not a valid value for the ${key} attribute, did you mean '${valid_value}'?`}
                  options={{
                    ...options,
                    query: validParts.join(" AND "),
                  }}
                  colors={colors}
                />,
              );
            }
          }
        }
      }
    }
  }

  if (
    options.result == "taxon" &&
    (!options.includeEstimates || options.includeEstimates == "false") &&
    !invalidTerm
  ) {
    suggestions.push(
      <Suggestion
        key={"include_estimates"}
        title={`Toggle 'includeEstimates'`}
        description={`Setting 'includeEstimates' to 'true' may include additional results`}
        options={{
          ...options,
          includeEstimates: true,
        }}
        colors={colors}
      />,
    );
  }
  // if any key in options matches /exclude\w+/
  if (
    Object.keys(options).some((key) => key.match(/exclude\w+/)) &&
    !invalidTerm
  ) {
    let newOptions = { ...options };
    let excludedAttributes = new Set();
    for (let key in options) {
      if (key.match(/exclude\w+/)) {
        delete newOptions[key];
        options[key].forEach((item) => excludedAttributes.add(item));
      }
    }
    let excludedList = [...excludedAttributes].join(", ");
    suggestions.push(
      <Suggestion
        key={"remove_exclude"}
        title={`Remove 'exclude' filters`}
        description={`Removing 'exclude' filters from ${excludedList.replace(/,([^,]+)$/, " and $1")} may restore missing results`}
        options={newOptions}
        colors={colors}
      />,
    );
  }
  if (["assembly", "taxon"].includes(options.result)) {
    let altIndex = options.result == "assembly" ? "taxon" : "assembly";
    suggestions.push(
      <Suggestion
        key={"switch_index"}
        title={`Switch to the ${altIndex} index`}
        description={`This query may be more appropriate for the ${altIndex} index`}
        options={{
          ...options,
          result: altIndex,
        }}
        colors={colors}
      />,
    );
  }

  if (suggestions.length == 0) {
    return null;
  }

  return (
    <div className={css} style={{ minWidth: "80vw" }}>
      <h2>Looks like there are no results for this query</h2>
      <p>In case that's not what you expected, you could try:</p>
      <div>{suggestions}</div>
    </div>
  );
};

export default compose(withTypes, withColors, withSearch)(SearchTips);
