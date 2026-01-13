import MuiTooltip, { tooltipClasses } from "@mui/material/Tooltip";
import { useCallback, useState } from "react";

import { compose } from "redux";
import { styled } from "@mui/material/styles";
import { useEventListener } from "#hooks/useEventListener";
import withTheme from "#hocs/withTheme";

const DarkTooltip = styled(({ className, ...props }) => (
  <MuiTooltip {...props} classes={{ popper: className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    fontSize: "1.1rem",
    backgroundColor: "#464752ee",
    color: "#ffffff",
    "& a": {
      color: "#ffffff",
    },
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#464752ee",
  },
}));

const LightTooltip = styled(({ className, ...props }) => (
  <MuiTooltip {...props} classes={{ popper: className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    fontSize: "1.1rem",
    backgroundColor: "#f0f0f0",
    color: "#464752ee",
    "& a": {
      color: "#464752ee",
    },
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: "#f0f0f0",
  },
}));

export const Tooltip = ({
  theme,
  setTheme,
  styleName = theme === "darkTheme" ? "default" : "dark",
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

  const StyledTooltip = theme === "lightTheme" ? DarkTooltip : LightTooltip;

  return (
    <StyledTooltip
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      disableInteractive={disableInteractive}
      sx={{ fontSize: "3rem" }}
      {...props}
    />
  );
};

export default compose(withTheme)(Tooltip);
