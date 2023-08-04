import MuiTooltip from "@material-ui/core/Tooltip";
import React from "react";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  tooltip: {
    fontSize: "0.9em",
  },
});

export const Tooltip = (props) => {
  const classes = useStyles();

  return <MuiTooltip classes={{ tooltip: classes.tooltip }} {...props} />;
};

export default Tooltip;
