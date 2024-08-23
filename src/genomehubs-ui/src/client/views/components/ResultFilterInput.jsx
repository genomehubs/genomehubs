import { Avatar, Chip } from "@mui/material";
import React, { useEffect, useState } from "react";
import { chip as chipStyle, ttOpts as ttOptsStyle } from "./Styles.scss";

import Checkbox from "@mui/material/Checkbox";
import FilterListIcon from "@mui/icons-material/FilterList";
import Tooltip from "./Tooltip";

const allowedOperators = ({ field, types, summary }) => {
  let operators = ["=", "==", "!="];
  let numeric = [">", ">=", "<", "<="];

  operators = numeric.concat(operators);
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
      className={chipStyle}
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
  handleOperatorChange,
  handleValueChange,
  handleDismiss,
}) => {
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
        <div className={ttOptsStyle}>
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
