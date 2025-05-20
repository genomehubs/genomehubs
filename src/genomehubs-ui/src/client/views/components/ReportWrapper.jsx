import LaunchIcon from "@mui/icons-material/Launch";
import React from "react";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import { useNavigate } from "@reach/router";
import withApi from "../hocs/withApi";
import withSiteName from "#hocs/withSiteName";

export const ReportWrapper = ({
  reportId,
  report,
  disableModal = true,
  basename,
  children,
}) => {
  const navigate = useNavigate();
  disableModal =
    report === "sources" ? true : report === "types" ? true : disableModal;

  const handleClick = () => {
    navigate(`${basename}/report?${reportId}`);
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <div
        style={{
          height: "100%",
          width: "100%",
          position: "relative",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            position: "absolute",
          }}
        >
          {children}
        </div>
        <Tooltip title={"Click to view full report"} arrow placement={"top"}>
          <div
            onClick={handleClick}
            style={{
              top: 0,
              right: 0,
              position: "absolute",
              marginRight: "0.25em",
              cursor: "pointer",
            }}
          >
            <LaunchIcon />
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

export default compose(withSiteName, withApi)(ReportWrapper);
