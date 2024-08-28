import React, { useCallback, useState } from "react";

import MuiTooltip from "@mui/material/Tooltip";
import makeStyles from "@mui/styles/makeStyles";
import { useEventListener } from "../hooks/useEventListener";

const useStyles = {
  default: makeStyles({
    tooltip: {
      fontSize: "1.2rem",
    },
  }),
  dark: makeStyles({
    arrow: {
      color: "#464752ee",
    },
    tooltip: {
      fontSize: "1.2rem",
      // backgroundColor: "#31323fcc",
      backgroundColor: "#464752ee",
      "& a": {
        color: "#ffffff",
      },
    },
  }),
};

export const Tooltip = ({ styleName = "dark", ...props }) => {
  const [open, setOpen] = useState(false);
  const onOpen = () => setOpen(true);
  const onClose = () => setOpen(false);

  const handler = useCallback((e) => {
    if (e.key === "Escape") {
      onClose();
    }
  }, []);

  useEventListener("keydown", handler);

  return (
    <MuiTooltip
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      classes={useStyles[styleName]()}
      {...props}
    />
  );
};

export default Tooltip;
