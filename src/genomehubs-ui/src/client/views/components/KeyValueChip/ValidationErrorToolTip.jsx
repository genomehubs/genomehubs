import ErrorIcon from "@mui/icons-material/Error";
import React from "react";
import Tooltip from "../Tooltip";

export const ValidationErrorTooltip = ({ validationError, textColor }) => {
  if (!validationError) {
    return null;
  }

  return (
    <Tooltip title={validationError} arrow>
      <span
        style={{
          marginLeft: "1px",
          color: textColor,
        }}
      >
        <ErrorIcon
          sx={{
            fontSize: "1.2em",
          }}
        />
      </span>
    </Tooltip>
  );
};

export default ValidationErrorTooltip;
