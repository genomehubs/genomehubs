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
