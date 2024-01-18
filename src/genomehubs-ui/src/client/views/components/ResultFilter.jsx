import React, { useEffect, useState } from "react";

import { FormControl } from "@material-ui/core";
import MuiTableCell from "@material-ui/core/TableCell";
import ResultFilterInput from "./ResultFilterInput";
import { compose } from "recompose";
import withSearch from "../hocs/withSearch";
import { withStyles } from "@material-ui/core/styles";

const TableCell = withStyles((theme) => ({
  root: {
    padding: "1px 6px",
  },
}))(MuiTableCell);

const ResultFilter = ({
  name,
  searchTerm,
  searchIndex,
  fieldMeta,
  value = "",
  operator = "",
  handleUpdate = () => {},
}) => {
  console.log({ fieldMeta });
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
          attributes.push(parts);
        }
      });
    }
    setAttrFilters(attributes);
    setTaxFilter(taxFilters);
  }, []);
  console.log(attrFilters);

  const handleChange = (e, i, action, value) => {
    value = value || e.target.value;
    if (!value) {
      return;
    }
    let attributes = [...attrFilters];
    let attribute = attributes[i] || [""];
    if (action == "operator") {
      attribute[1] = value;
    } else if (action == "value") {
      attribute[2] = value;
    }
    if (action == "dismiss") {
      delete attributes[i];
    } else {
      attributes[i] = attribute;
    }
    setAttrFilters(attributes);
  };

  let filters = [];
  attrFilters.forEach((arr, i) => {
    if (arr.length > 1 && arr[0] == name) {
      filters.push(
        <ResultFilterInput
          key={i}
          field={name}
          fields={[]}
          types={{ [name]: fieldMeta }}
          value={arr[2] || ""}
          operator={arr[1] || ""}
          handleOperatorChange={(e) => handleChange(e, i, "operator")}
          handleValueChange={(e, obj = {}) => {
            let { id, value } = obj;
            return handleChange(e, i, "value", value);
          }}
          handleDismiss={(e) => handleChange(e, i, "dismiss")}
        />
      );
    }
  });
  if (filters.length == 0) {
    filters.push(
      <ResultFilterInput
        key={0}
        field={name}
        fields={[]}
        value={""}
        operator={""}
        types={{ [name]: fieldMeta }}
        handleOperatorChange={(e) =>
          handleChange(e, filters.length, "operator")
        }
        handleValueChange={(e, obj = {}) => {
          let { id, value } = obj;
          return handleChange(e, filters.length, "value", value);
        }}
        handleDismiss={(e) => handleChange(e, filters.length, "dismiss")}
      />
    );
  }
  console.log({ [name]: fieldMeta });

  return (
    <TableCell key={name}>
      <FormControl size="small">{filters}</FormControl>
    </TableCell>
  );
};

export default compose(withSearch)(ResultFilter);
