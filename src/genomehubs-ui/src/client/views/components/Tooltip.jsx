import MuiTooltip, { tooltipClasses } from "@mui/material/Tooltip";
import React, { useCallback, useState } from "react";

import makeStyles from "@mui/styles/makeStyles";
import { styled } from "@mui/material/styles";
import { useEventListener } from "../hooks/useEventListener";

const StyledTooltip = styled(({ className, ...props }) => (
  <MuiTooltip {...props} classes={{ popper: className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    fontSize: "1.1rem",
    backgroundColor: "#464752ee",
    "& a": {
      color: "#ffffff",
    },
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#464752ee",
  },
}));
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

export const Tooltip = ({
  styleName = "dark",
  disableInteractive = true,
  ...props
}) => {
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
    <StyledTooltip
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      classes={useStyles[styleName]()}
      disableInteractive={disableInteractive}
      sx={{ fontSize: "3rem" }}
      {...props}
    />
  );
};

export default Tooltip;
