import ButtonGroup from "@mui/material/ButtonGroup";
import { forwardRef } from "react";
import { styled } from "@mui/material/styles";

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
  color: theme.palette.button.contrastText,
  backgroundColor: theme.palette.button.main,
  "&:hover": {
    backgroundColor: theme.palette.button.hover,
  },
  "& .MuiButtonGroup-grouped:not(:last-of-type)": {
    borderColor: theme.palette.button.contrastText,
  },
}));

export const ColorButtonGroup = forwardRef(({ children, ...props }, ref) => {
  return (
    <StyledButtonGroup color="button" {...props} ref={ref}>
      {children}
    </StyledButtonGroup>
  );
});

export default ColorButtonGroup;
