import BasicTextField from "./BasicTextField";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import React from "react";
import Select from "@mui/material/Select";
import makeStyles from "@mui/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: "16px",
    minWidth: "120px",
  },
}));

const BasicSelect = ({
  current = "",
  id,
  // handleBlur = (e) => {
  //   e.preventDefault();
  // },
  handleChange = (e) => {
    e.preventDefault();
  },
  handleBlur = handleChange,
  label,
  helperText,
  values,
  sx,
}) => {
  const classes = useStyles;
  if (typeof current != "string") {
    current = "";
  }
  let options = [];
  if (typeof values == "string") {
    values = values.split(",").reduce((a, val) => {
      let [v, k] = val.split(":");
      if (typeof k === "undefined") {
        k = v;
      }
      return { ...a, [k]: v };
    }, {});
  }
  if (Array.isArray(values)) {
    options = values;
  } else {
    Object.keys(values)
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        options.push(
          <MenuItem value={values[key]} style={{ paddingTop: "0px" }} key={key}>
            {values[key]} {key != values[key] && ` — ${key}`}
          </MenuItem>,
        );
      });
  }
  if (options.length == 0) {
    return null;
  }

  return (
    <FormControl variant="standard" className={classes.formControl}>
      {label && <InputLabel id={`${id}-label`}>{label}</InputLabel>}
      <Select
        variant="standard"
        labelId={label ? `${id}-label` : undefined}
        id={id}
        value={current}
        onBlur={handleBlur}
        onChange={handleChange}
        label={label}
        inputProps={{ "aria-label": label || helperText }}
        sx={sx}
      >
        {options}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default BasicSelect;
