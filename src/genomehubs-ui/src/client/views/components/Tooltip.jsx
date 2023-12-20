import MuiTooltip from "@material-ui/core/Tooltip";
import React from "react";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = {
  default: makeStyles({
    tooltip: {
      fontSize: "0.9rem",
    },
  }),
  dark: makeStyles({
    arrow: {
      color: "#464752ee",
    },
    tooltip: {
      fontSize: "0.9rem",
      // backgroundColor: "#31323fcc",
      backgroundColor: "#464752ee",
      "& a": {
        color: "#ffffff",
      },
    },
  }),
};

export const Tooltip = ({ styleName = "dark", ...props }) => {
  return <MuiTooltip classes={useStyles[styleName]()} {...props} />;
};

export default Tooltip;
