import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import React from "react";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paper,
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
        style={{ paddingTop: 0, paddingBottom: 0 }}
      >
        <ListItem
          button
          aria-haspopup="true"
          aria-controls={id}
          aria-label={label}
          onClick={handleClickListItem}
          style={{ paddingTop: 0, paddingBottom: 0 }}
        >
          <ListItemText
            primary={label}
            secondary={options[selectedIndex]}
            style={{ paddingTop: 0, paddingBottom: 0 }}
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
// import { makeStyles } from "@material-ui/core/styles";
// import InputLabel from "@material-ui/core/InputLabel";
// import MenuItem from "@material-ui/core/MenuItem";
// import FormControl from "@material-ui/core/FormControl";
// import FormHelperText from "@material-ui/core/FormHelperText";
// import Select from "@material-ui/core/Select";
// import BasicTextField from "./BasicTextField";

// const useStyles = makeStyles((theme) => ({
//   formControl: {
//     margin: theme.spacing(2),
//     minWidth: 120,
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
