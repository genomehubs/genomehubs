import React from "react";
import Tooltip from "../Tooltip";
import WarningIcon from "@mui/icons-material/Warning";

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
          filter: "drop-shadow(0 0 4px rgba(0,0,0,0.5))",
        }}
      >
        <WarningIcon
          sx={{
            fontSize: "1.2em",
            marginTop: "-0.5em",
          }}
        />
      </span>
    </Tooltip>
  );
};

export default ValidationErrorTooltip;
