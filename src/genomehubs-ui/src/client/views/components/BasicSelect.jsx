import BasicTextField from "./BasicTextField";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import React from "react";
import Select from "@material-ui/core/Select";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(2),
    minWidth: 120,
  },
}));

const BasicSelect = ({
  current,
  id,
  handleBlur = (e) => {
    e.preventDefault();
  },
  handleChange = (e) => {
    e.preventDefault();
  },
  label,
  helperText,
  values,
}) => {
  const classes = useStyles;
  let options = [];
  if (Array.isArray(values)) {
    options = values;
  } else {
    Object.keys(values)
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        options.push(
          <MenuItem value={values[key]} style={{ paddingTop: 0 }} key={key}>
            {key}
          </MenuItem>
        );
      });
  }

  return (
    <FormControl className={classes.formControl}>
      {label && <InputLabel id={`${id}-label`}>{label}</InputLabel>}
      <Select
        labelId={label ? `${id}-label` : undefined}
        id={id}
        value={current}
        onBlur={handleBlur}
        onChange={handleChange}
        label={label}
        inputProps={{ "aria-label": label ? label : helperText }}
      >
        {options}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default BasicSelect;
