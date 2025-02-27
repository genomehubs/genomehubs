import React, { forwardRef } from "react";

import Button from "@mui/material/Button";
import { grey } from "@mui/material/colors";
import { styled } from "@mui/material/styles";

const StyledButton = styled(Button)(({ theme }) => ({
  color: theme.palette.button.contrastText,
  backgroundColor: theme.palette.button.main,
  "&:hover": {
    backgroundColor: theme.palette.button.hover,
  },
}));

export const ColorButton = forwardRef(({ children, ...props }, ref) => {
  return (
    <StyledButton color="button" {...props} ref={ref}>
      {children}
    </StyledButton>
  );
});

export default ColorButton;
