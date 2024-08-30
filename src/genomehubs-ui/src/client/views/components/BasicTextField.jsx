import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import React from "react";
import TextField from "@mui/material/TextField";
import makeStyles from "@mui/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: "16px",
    minWidth: "120px",
  },
}));
const BasicTextField = ({
  id,
  handleBlur = (e) => {
    e.preventDefault();
  },
  handleChange = (e) => {
    e.preventDefault();
  },
  label,
  helperText,
  value,
}) => {
  const classes = useStyles;
  return (
    <FormControl variant="standard" className={classes.formControl}>
      <TextField
        variant="standard"
        id={id}
        label={label}
        value={value || ""}
        onBlur={handleBlur}
        onChange={handleChange}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default BasicTextField;
