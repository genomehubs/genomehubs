import { Avatar, Chip, MenuItem } from "@material-ui/core";
import React, { useEffect, useState } from "react";

import AutoCompleteInput from "./AutoCompleteInput";
import AutorenewIcon from "@material-ui/icons/Autorenew";
import BasicSelect from "./BasicSelect";
import BasicTextField from "./BasicTextField";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import CloseIcon from "@material-ui/icons/Close";
import FilterListIcon from "@material-ui/icons/FilterList";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "./Tooltip";
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
  return operators;
};

const allowedValues = ({ types, field, summary, constraints }) => {
  return constraints || types[field]?.constraint?.enum;
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
      autoFocus={typeof currentValue === "undefined" || currentValue === ""}
    />
  );
};

const ResultFilterInput = ({
  types,
  field,
  constraints,
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
  const [editable, setEditable] = useState(false);
  value = value == "undefined" || typeof value === "undefined" ? "" : value;
  operator =
    operator == "undefined" || typeof operator === "undefined" ? "" : operator;
  let values = allowedValues({ field, types, summary, constraints });
  let operators = allowedOperators({ field, types, summary });

  useEffect(() => {
    if (value > "") {
      setActive(true);
    } else {
      setActive(false);
    }
  }, [operator, value]);

  const ChipOptions = ({ title, children, allowedValues, handleChange }) => {
    if (allowedValues) {
      title = (
        <div className={styles.ttOpts}>
          {title}:
          <ul>
            {allowedValues.map((v) => (
              <li
                key={v}
                onClick={(e) => {
                  handleChange({ target: { value: v } });
                }}
              >
                {v}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <Tooltip title={title} styleName="dark" interactive arrow>
        <span>{children}</span>
      </Tooltip>
    );
  };

  const ChipLabel = ({ label, allowedValues }) => {
    return (
      <ChipOptions
        title={"Set value"}
        allowedValues={allowedValues}
        handleChange={(e) => e.target.value != label && handleValueChange(e)}
      >
        <ChipInput
          defaultWidth={1}
          value={label}
          placeholder={"+"}
          onBlur={(e) => e.target.value != label && handleValueChange(e)}
        />
      </ChipOptions>
    );
  };

  const AvatarLabel = ({ label, allowedValues }) => {
    return (
      <ChipOptions
        title={"Comparison operator"}
        allowedValues={allowedValues}
        handleChange={(e) => e.target.value != label && handleOperatorChange(e)}
      >
        <ChipInput
          defaultWidth={1}
          value={label}
          placeholder={"enter value"}
          onBlur={(e) => e.target.value != label && handleOperatorChange(e)}
        />
      </ChipOptions>
    );
  };

  if (value == "" && operator == "" && !editable) {
    let color = "grey";
    return (
      <span style={{ marginRight: "0.5em" }}>
        <Checkbox
          style={{
            padding: "1px",
            color,
          }}
          icon={<FilterListIcon style={{ fontSize: "small", fill: color }} />}
          checkedIcon={
            <FilterListIcon style={{ fontSize: "small", fill: color }} />
          }
          onClick={() => setEditable(!editable)}
        />
      </span>
    );
  }

  return (
    <span style={{ marginRight: "0.5em" }}>
      <Chip
        color={active ? "primary" : "default"}
        size="small"
        label={<ChipLabel label={value} allowedValues={values} />}
        {...(active && {
          onDelete: handleDismiss,
          avatar: (
            <Avatar>
              {<AvatarLabel label={operator} allowedValues={operators} />}
            </Avatar>
          ),
        })}
      />
    </span>
  );
};

export default ResultFilterInput;
