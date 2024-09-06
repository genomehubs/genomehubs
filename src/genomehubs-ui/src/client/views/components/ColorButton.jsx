import React, { forwardRef } from "react";

import Button from "@mui/material/Button";
import { grey as orange } from "@mui/material/colors";
import { styled } from "@mui/material/styles";

const StyledButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(orange[400]),
  backgroundColor: orange[400],
  "&:hover": {
    backgroundColor: orange[600],
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
