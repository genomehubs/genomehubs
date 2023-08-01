import React, { useState } from "react";

import DialogContent from "@material-ui/core/DialogContent";
import Modal from "@material-ui/core/Modal";
import ReportFull from "./ReportFull";
import { compose } from "recompose";
import { makeStyles } from "@material-ui/core/styles";
import { sortReportQuery } from "../selectors/report";
import { useNavigate } from "@reach/router";
import withApi from "../hocs/withApi";
import withSiteName from "../hocs/withSiteName";

function getModalStyle() {
  return {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };
}

export const useStyles = makeStyles((theme) => ({
  paper: {
    position: "absolute",
    backgroundColor: theme.palette.background.paper,
    border: "none",
    boxShadow: "none",
    padding: "10px",
    overflow: "visible",
    "&:focus": {
      outline: "none",
    },
  },
  img: {},
}));

export const ReportModal = ({
  reportId,
  report,
  disableModal,
  queryString,
  basename,
  children,
}) => {
  const navigate = useNavigate();
  const [modalStyle] = useState(getModalStyle);
  const [open, setOpen] = useState(false);
  disableModal =
    report === "sources" ? true : report === "types" ? true : disableModal;
  // disableModal = true;

  const handleOpen = () => {
    if (!disableModal) {
      //setOpen(true);
      navigate(`${basename}/report?${reportId}`);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };
  const body = (
    <ReportFull
      reportId={sortReportQuery({ queryString: reportId })}
      report={report}
      queryString={queryString}
      modalStyle={modalStyle}
      handleClose={handleClose}
    />
  );

  return (
    <div onClick={handleOpen} style={{ height: "100%", width: "100%" }}>
      <div
        style={{
          cursor: open ? "default" : disableModal ? "default" : "pointer",
          height: "100%",
          width: "100%",
        }}
      >
        <div
          style={{
            pointerEvents: open ? "auto" : disableModal ? "auto" : "none",
            height: "100%",
            width: "100%",
          }}
        >
          {children}
        </div>
      </div>
      <Modal
        open={open}
        onClose={handleClose}
        container={() => document.getElementById("theme-base")}
        aria-labelledby="file-modal-title"
        aria-describedby="file-modal-description"
      >
        <DialogContent onClick={handleClose} style={{ outline: "none" }}>
          {body}
        </DialogContent>
      </Modal>
    </div>
  );
};

export default compose(withSiteName, withApi)(ReportModal);
