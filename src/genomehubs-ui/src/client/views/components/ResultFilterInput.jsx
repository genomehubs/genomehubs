import { Avatar, Chip, MenuItem } from "@material-ui/core";
import React, { useEffect, useState } from "react";

import AutoCompleteInput from "./AutoCompleteInput";
import AutorenewIcon from "@material-ui/icons/Autorenew";
import BasicSelect from "./BasicSelect";
import BasicTextField from "./BasicTextField";
import Button from "@material-ui/core/Button";
import CloseIcon from "@material-ui/icons/Close";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import styles from "./Styles.scss";
import { useStyles } from "./QueryBuilder";

const allowedSummaries = ({ field, types }) => {
  let values = { value: "value" };
  let possible = [
    { key: "list", value: "length" },
    { key: "max" },
    { key: "min" },
    { key: "range" },
  ];
  let summaries = types[field]?.summary || [];
  if (!Array.isArray(summaries)) {
    summaries = [summaries];
  }
  for (let obj of possible) {
    if (summaries.includes(obj.key)) {
      let summary = obj.value || obj.key;
      values[summary] = summary;
    }
  }
  return values;
};

const allowedOperators = ({ field, types, summary }) => {
  let operators = ["=", "==", "!="];
  let numeric = [">", ">=", "<", "<="];
  let type = types[field]?.type || "keyword";
  // if (type == "keyword" && summary == "value") {
  //   let summary = types[field]?.summary || "list";
  //   if (Array.isArray(summary)) {
  //     summary = summary[0];
  //   }
  //   if (summary == "enum") {
  //     operators = numeric.concat(operators);
  //   }
  // } else {
  operators = numeric.concat(operators);
  // }
  return ["", ...operators].map((value, i) => (
    <MenuItem key={i} value={value}>
      {value}
    </MenuItem>
  ));
};

const ChipInput = ({ defaultWidth, value, placeholder, onBlur }) => {
  const [currentValue, setCurrentValue] = useState(value);
  return (
    <input
      type="text"
      className={styles.chip}
      style={{
        width: `${currentValue ? currentValue.length + 0.5 : defaultWidth}ch`,
      }}
      value={currentValue}
      placeholder={placeholder}
      onChange={(e) => setCurrentValue(e.target.value)}
      onBlur={onBlur}
      onKeyUp={(e) => {
        if (e.key === "Enter") {
          onBlur(e);
        }
      }}
    />
  );
};

const ResultFilterInput = ({
  types,
  field,
  operator = "",
  value = "",
  summary = "value",
  bool,
  label,
  fields,
  type = types[field]?.type || "keyword",
  handleVariableChange,
  handleOperatorChange,
  handleSummaryChange,
  handleValueChange,
  handleUpdate,
  handleDismiss,
}) => {
  const classes = useStyles();
  const [active, setActive] = useState(false);
  value = value == "undefined" || typeof value === "undefined" ? "" : value;
  operator =
    operator == "undefined" || typeof operator === "undefined" ? "" : operator;

  useEffect(() => {
    if (value > "") {
      setActive(true);
    } else {
      setActive(false);
    }
  }, [operator, value]);

  const ChipLabel = ({ label }) => {
    return (
      <ChipInput
        defaultWidth={9}
        value={label}
        placeholder={"enter value"}
        onBlur={handleValueChange}
      />
    );
  };

  const AvatarLabel = ({ label }) => {
    return (
      <ChipInput
        defaultWidth={1}
        value={label}
        placeholder={"enter value"}
        onBlur={handleOperatorChange}
      />
    );
  };

  return (
    <div>
      <Chip
        color={active ? "primary" : "default"}
        size="small"
        label={<ChipLabel label={value} />}
        {...(active && {
          onDelete: handleDismiss,
          avatar: <Avatar>{<AvatarLabel label={operator} />}</Avatar>,
        })}
      />
    </div>
  );
};

export default ResultFilterInput;
