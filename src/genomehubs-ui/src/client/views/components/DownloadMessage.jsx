import React, { useEffect } from "react";

import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import MuiAlert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { compose } from "recompose";
import withColors from "#hocs/withColors";
import withController from "../hocs/withController";
import withMessage from "../hocs/withMessage";
import withTheme from "#hocs/withTheme";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const DownloadMessage = ({
  message,
  setMessage,
  controller,
  colorScheme,
  theme,
}) => {
  let { message: text, severity, duration, x, y, total } = message || {};
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    if (text && text > "") {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [text]);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    if (reason === "timeout") {
      setMessage({ severity });
      setOpen(false);
      return;
    }
    controller.abort();
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    >
      <div style={{ position: "relative" }}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: "100%" }}>
          {text}
        </Alert>
        {total && (
          <div
            style={{
              position: "absolute",
              borderRadius: 2,
              bottom: 4,
              left: "1em",
              right: "3em",
              height: "4px",
              width: "auto",
              backgroundColor: colorScheme[theme].lightColor,
              overflow: "hidden",
            }}
          >
            {x && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "4px",
                  width: `${(x / total) * 100}%`,
                  backgroundColor: "#2196f3",
                  opacity: "50%",
                }}
              />
            )}
            {y && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "4px",
                  width: `${(y / total) * 100}%`,
                  backgroundColor: "#2196f3",
                  opacity: "50%",
                }}
              />
            )}
          </div>
        )}
      </div>
    </Snackbar>
  );
};

export default compose(
  withController,
  withTheme,
  withColors,
  withMessage,
)(DownloadMessage);
