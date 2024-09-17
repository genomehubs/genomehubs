import React, { forwardRef } from "react";

import Button from "@mui/material/Button";
import { grey } from "@mui/material/colors";
import { styled } from "@mui/material/styles";

const StyledButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(grey[300]),
  backgroundColor: grey[300],
  "&:hover": {
    backgroundColor: grey[500],
  },
}));

export const ColorButton = forwardRef(({ children, ...props }, ref) => {
  return (
    <StyledButton color="primary" {...props} ref={ref}>
      {children}
    </StyledButton>
  );
});

export default ColorButton;
