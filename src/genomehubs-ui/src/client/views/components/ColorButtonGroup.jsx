import React, { forwardRef } from "react";

import ButtonGroup from "@mui/material/ButtonGroup";
import { grey } from "@mui/material/colors";
import { styled } from "@mui/material/styles";

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
  color: theme.palette.getContrastText(grey[300]),
  backgroundColor: grey[300],
  "&:hover": {
    backgroundColor: grey[500],
  },
  "& .MuiButtonGroup-grouped:not(:last-of-type)": {
    borderColor: grey[400],
  },
}));

export const ColorButtonGroup = forwardRef(({ children, ...props }, ref) => {
  return (
    <StyledButtonGroup color="primary" {...props} ref={ref}>
      {children}
    </StyledButtonGroup>
  );
});

export default ColorButtonGroup;
