import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import Autocomplete from "@material-ui/lab/Autocomplete";
import TextField from "@material-ui/core/TextField";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(2),
    minWidth: 120,
  },
}));

const BasicComplete = ({
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
  Object.keys(values).forEach((key) => {
    options.push(<MenuItem value={values[key]}>{key}</MenuItem>);
  });
  return (
    <FormControl className={classes.formControl}>
      <Autocomplete
        id={id}
        value={current}
        onBlur={handleBlur}
        onChange={handleChange}
        options={values}
        getOptionLabel={(option) => option}
        style={{ width: 300 }}
        renderInput={(params) => (
          <TextField {...params} label={label} style={{ width: 300 }} />
        )}
      />

      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default BasicComplete;
