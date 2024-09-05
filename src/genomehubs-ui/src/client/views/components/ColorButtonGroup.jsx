import ButtonGroup from "@mui/material/ButtonGroup";
import React from "react";
import { grey as orange } from "@mui/material/colors";
import { styled } from "@mui/material/styles";

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
  color: theme.palette.getContrastText(orange[400]),
  backgroundColor: orange[400],
  "&:hover": {
    backgroundColor: orange[600],
  },
  "& .MuiButtonGroup-grouped:not(:last-of-type)": {
    borderColor: orange[500],
  },
}));

export const ColorButtonGroup = ({ children, ...props }) => {
  return (
    <StyledButtonGroup color="primary" {...props} >
      {children}
    </StyledButtonGroup>
  );
};

export default ColorButtonGroup;
