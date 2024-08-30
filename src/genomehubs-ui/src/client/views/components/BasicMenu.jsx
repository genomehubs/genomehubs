import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import React from "react";
import makeStyles from "@mui/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: "white",
  },
}));

const BasicMenu = ({
  current,
  id,
  label,
  helperText,
  options,
  handleChange,
}) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedIndex, setSelectedIndex] = React.useState(
    options.indexOf(current)
  );

  const handleClickListItem = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (event, index) => {
    setSelectedIndex(index);
    setAnchorEl(null);
    handleChange(options[index]);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className={classes.root}>
      <List
        component="nav"
        aria-label={helperText}
        style={{ paddingTop: "0px", paddingBottom: "0px" }}
      >
        <ListItem
          button
          aria-haspopup="true"
          aria-controls={id}
          aria-label={label}
          onClick={handleClickListItem}
          style={{ paddingTop: "0px", paddingBottom: "0px" }}
        >
          <ListItemText
            primary={label}
            secondary={options[selectedIndex]}
            style={{ paddingTop: "0px", paddingBottom: "0px" }}
          />
        </ListItem>
      </List>
      <Menu
        id={id}
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {options.map((option, index) => (
          <MenuItem
            key={option}
            selected={index === selectedIndex}
            onClick={(event) => handleMenuItemClick(event, index)}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default BasicMenu;

// import React from "react";
// import { makeStyles } from "@mui/material/styles";
// import InputLabel from "@mui/material/InputLabel";
// import MenuItem from "@mui/material/MenuItem";
// import FormControl from "@mui/material/FormControl";
// import FormHelperText from "@mui/material/FormHelperText";
// import Select from "@mui/material/Select";
// import BasicTextField from "./BasicTextField";

// const useStyles = makeStyles((theme) => ({
//   formControl: {
//     margin: "16px",
//     minWidth: "120px",
//   },
// }));

// const BasicSelect = ({
//   current,
//   id,
//   handleBlur = (e) => {
//     e.preventDefault();
//   },
//   handleChange = (e) => {
//     e.preventDefault();
//   },
//   label,
//   helperText,
//   values,
// }) => {
//   const classes = useStyles;
//   let options = [];
//   Object.keys(values).forEach((key) => {
//     options.push(<MenuItem value={values[key]}>{key}</MenuItem>);
//   });
//   return (
//     <FormControl className={classes.formControl}>
//       {label && <InputLabel id={`${id}-label`}>{label}</InputLabel>}
//       <Select
//         labelId={label ? `${id}-label` : undefined}
//         id={id}
//         value={current}
//         onBlur={handleBlur}
//         onChange={handleChange}
//         label={label}
//         inputProps={{ "aria-label": label ? label : helperText }}
//       >
//         {options}
//       </Select>
//       {helperText && <FormHelperText>{helperText}</FormHelperText>}
//     </FormControl>
//   );
// };

// export default BasicSelect;
