import AutorenewIcon from "@material-ui/icons/Autorenew";
import BasicSelect from "./BasicSelect";
import BasicTextField from "./BasicTextField";
import Button from "@material-ui/core/Button";
import CloseIcon from "@material-ui/icons/Close";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import { MenuItem } from "@material-ui/core";
import React from "react";
import Typography from "@material-ui/core/Typography";
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
  if (type == "keyword" && summary == "value") {
    let summary = types[field]?.summary || "list";
    if (Array.isArray(summary)) {
      summary = summary[0];
    }
    if (summary == "enum") {
      operators = numeric.concat(operators);
    }
  } else {
    operators = numeric.concat(operators);
  }
  return ["", ...operators].map((value, i) => (
    <MenuItem key={i} value={value}>
      {value}
    </MenuItem>
  ));
};

const VariableFilter = ({
  types = {},
  field,
  operator = "",
  value = "",
  summary = "value",
  bool,
  label,
  fields,
  handleVariableChange,
  handleOperatorChange,
  handleSummaryChange,
  handleValueChange,
  handleUpdate,
  handleDismiss,
}) => {
  const classes = useStyles();
  operator = operator == "undefined" ? "" : operator;
  field = field == "undefined" ? "" : field;
  summary = summary == "undefined" ? "" : summary;
  value = value == "undefined" ? "" : value;
  return (
    <Grid container alignItems="center" direction="row" spacing={2}>
      {bool && (
        <Grid item>
          <Typography>{bool}</Typography>
        </Grid>
      )}
      {field && handleSummaryChange && (
        <Grid item>
          <BasicSelect
            current={summary}
            id={`summary-${field}-select`}
            handleChange={handleSummaryChange}
            helperText={"summary"}
            values={allowedSummaries({ field, types })}
          />
        </Grid>
      )}
      <Grid item>
        <BasicSelect
          current={field}
          id={`variable-${field}-select`}
          handleChange={handleVariableChange}
          helperText={"field"}
          values={fields}
        />
      </Grid>
      <Grid item>
        <BasicSelect
          current={operator}
          id={`variable-${field}-operator-select`}
          handleChange={handleOperatorChange}
          helperText={"operator"}
          values={allowedOperators({ field, types, summary })}
        />
      </Grid>
      <Grid item>
        <BasicTextField
          id={`variable-${field}-value-input`}
          handleChange={handleValueChange}
          helperText={"value"}
          value={value}
        />
      </Grid>
      {handleDismiss && (
        <Grid item style={{ marginLeft: "auto" }}>
          <IconButton
            aria-label="remove filter"
            size="small"
            onClick={handleDismiss}
          >
            <CloseIcon />
          </IconButton>
        </Grid>
      )}
      {handleUpdate && (
        <Grid item>
          <Button
            variant="contained"
            color="default"
            startIcon={<AutorenewIcon />}
            onClick={handleUpdate}
            disableElevation
          >
            Update
          </Button>
        </Grid>
      )}
    </Grid>
  );
};

export default VariableFilter;
