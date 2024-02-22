import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import { FormControl } from "@material-ui/core";
import MuiTableCell from "@material-ui/core/TableCell";
import ResultFilterInput from "./ResultFilterInput";
import classnames from "classnames";
import { compose } from "recompose";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import withSearch from "../hocs/withSearch";
import withSiteName from "../hocs/withSiteName";
import { withStyles } from "@material-ui/core/styles";

const DefaultTableCell = withStyles((theme) => ({
  root: {
    padding: "1px 6px",
  },
}))(MuiTableCell);

const ResultFilter = ({
  name,
  type = "attribute",
  basename,
  searchTerm,
  searchIndex,
  fieldMeta,
  colSpan = 1,
  TableCell,
  value = "",
  operator = "",
  handleUpdate = () => {},
}) => {
  if (!TableCell) {
    TableCell = DefaultTableCell;
  }
  if (type == "hidden") {
    return <TableCell key={name} />;
  }
  let ranks = {
    "": "",
    superkingdom: "superkingdom",
    kingdom: "kingdom",
    phylum: "phylum",
    class: "class",
    order: "order",
    family: "family",
    genus: "genus",
    species: "species",
    subspecies: "subspecies",
  };
  let taxFilters = {
    taxon: null,
    filter: "tax_name",
    rank: "",
    level: null,
  };

  const navigate = useNavigate();
  const [index, setIndex] = useState(searchIndex);
  let [attrFilters, setAttrFilters] = useState([]);
  let [taxFilter, setTaxFilter] = useState(taxFilters);
  let bool = false;

  useEffect(() => {
    let attributes = [];
    if (searchTerm.query) {
      searchTerm.query.split(/\s*AND\s*/).forEach((term) => {
        let taxQuery = term.match(/tax_(\w+)\((.+?)\)/);
        if (taxQuery) {
          if (taxQuery[1] == "rank") {
            taxFilters.rank = taxQuery[2] || "";
            bool = "AND";
          } else if (taxQuery[1] == "depth") {
            taxFilters.depth = taxQuery[2];
          } else {
            taxFilters.taxon = taxQuery[2];
            taxFilters.filter = `tax_${taxQuery[1]}`;
          }
        } else {
          let parts = term.split(/\s*([\>\<=]+)\s*/);
          if (parts[0].endsWith("!")) {
            parts[1] = `!${parts[1]}`;
            parts[0] = parts[0].replace("!", "");
          }
          let nameParts = parts[0].split(/[\(\)]/);
          if (nameParts.length > 1) {
            parts[0] = `${nameParts[1]}:${nameParts[0]}`;
          }
          attributes.push(parts);
        }
      });
    }
    setAttrFilters(attributes);
    setTaxFilter(taxFilters);
  }, []);

  const updateSearch = (attributes) => {
    let parts = [];
    if (taxFilter) {
      if (taxFilter.taxon && taxFilter.filter) {
        parts.push(`${taxFilter.filter}(${taxFilter.taxon})`);
      }
      if (taxFilter.rank && taxFilter.rank > "") {
        parts.push(`tax_rank(${taxFilter.rank})`);
      }
      if (taxFilter.level) {
        parts.push(`tax_level(${taxFilter.level})`);
      }
    }
    for (let arr of attributes) {
      if (!arr) {
        continue;
      }
      let attrParts = arr[0].split(":");
      if (arr.length == 1) {
        if (attrParts.length == 2) {
          parts.push(`${attrParts[1]}(${attrParts[0]})`);
        } else {
          parts.push(`${arr[0]}`);
        }
      } else if (attrParts.length == 2) {
        parts.push(`${attrParts[1]}(${attrParts[0]})${arr[1]}${arr[2]}`);
      } else {
        parts.push(`${arr[0]}${arr[1]}${arr[2]}`);
      }
    }
    let options = { ...searchTerm, query: parts.join(" AND ") };
    navigate(`${basename}/search?${qs.stringify(options)}`);
  };

  const handleChange = (e, i, action, attributes) => {
    let { value } = e.target;
    // if (!value) {
    //   return;
    // }
    attributes = [...attrFilters];
    let attribute = attributes[i] || [i, "=", ""];
    if (action == "operator") {
      attribute[1] = value;
    } else if (action == "value") {
      let parts = value.split(/(<=|==|>=|!=|<|=|>)/);
      if (parts.length > 1) {
        attribute[1] = parts[1];
        attribute[2] = parts[2];
      } else {
        attribute[2] = value;
      }
    }
    if (action == "dismiss") {
      delete attributes[i];
    } else if (value > "") {
      if (isNaN(i)) {
        attributes.push(attribute);
      } else {
        attributes[i] = attribute;
      }
    }
    updateSearch(attributes);
    // setAttrFilters(attributes);
  };

  let filters = [];

  // useEffect(() => {
  //   console.log("change");
  //   console.log(attrFilters);
  // }, [attrFilters]);
  attrFilters.forEach((arr, i) => {
    if (arr && arr.length > 1 && arr[0] == name) {
      filters.push(
        <ResultFilterInput
          key={i}
          field={name}
          fields={[]}
          types={{ [name]: fieldMeta }}
          value={arr[2] || ""}
          operator={arr[1] || ""}
          handleOperatorChange={(e) =>
            handleChange(e, i, "operator", [...attrFilters])
          }
          handleValueChange={(e, obj = {}) => {
            return handleChange(e, i, "value", [...attrFilters]);
          }}
          handleDismiss={(e) => handleChange(e, i, "dismiss", [...attrFilters])}
        />
      );
    }
  });
  // if (filters.length == 0) {
  filters.push(
    <ResultFilterInput
      key={"last"}
      field={name}
      fields={[]}
      value={""}
      operator={""}
      types={{ [name]: fieldMeta }}
      handleOperatorChange={(e) =>
        handleChange(e, name, "operator", [...attrFilters])
      }
      handleValueChange={(e) => {
        return handleChange(e, name, "value", [...attrFilters]);
      }}
      handleDismiss={() => {}}
    />
  );
  // }
  let css = "";
  if (colSpan > 1) {
    css = classnames(styles.first, styles.last);
  }

  return (
    <TableCell key={name} colSpan={colSpan} className={css}>
      <FormControl size="small" style={{ width: "100%" }}>
        <div style={{ width: "100%" }}>{filters}</div>
      </FormControl>
    </TableCell>
  );
};

export default compose(withSiteName, withSearch)(ResultFilter);
