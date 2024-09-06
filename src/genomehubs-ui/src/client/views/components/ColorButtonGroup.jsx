import React, { forwardRef } from "react";

import ButtonGroup from "@mui/material/ButtonGroup";
import { grey as orange } from "@mui/material/colors";
import { styled } from "@mui/material/styles";

const StyledButtonGroup = styled(ButtonGroup)(
  forwardRef(({ theme }, ref) => ({
    color: theme.palette.getContrastText(orange[400]),
    backgroundColor: orange[400],
    "&:hover": {
      backgroundColor: orange[600],
    },
    "& .MuiButtonGroup-grouped:not(:last-of-type)": {
      borderColor: orange[500],
    },
  }))
);

export const ColorButtonGroup = forwardRef(({ children, ...props }, ref) => {
  return (
    <ButtonGroup color="primary" {...props} ref={ref}>
      {children}
    </ButtonGroup>
  );
});

export default ColorButtonGroup;
