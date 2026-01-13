import AttributeModal from "./AttributeModal";
import DialogContent from "@mui/material/DialogContent";
import Modal from "@mui/material/Modal";
import React from "react";
import { compose } from "redux";
import makeStyles from "@mui/styles/makeStyles";
import withRecord from "#hocs/withRecord";

export const useStyles = makeStyles((theme) => ({
  modal: {
    display: "flex",
    padding: "8px",
    alignItems: "center",
    justifyContent: "center",
  },
  paper: {
    width: "400px",
    maxWidth: "75vw",
    maxHeight: "75vh",
    backgroundColor: "white",
    border: "2px solid #000",
    boxShadow: "#333333", // theme.shadows[5],
    padding: "16px 32px 24px",
    cursor: "default",
    outline: 0,
  },
}));

export const ResultModalControl = ({
  attributeSettings,
  setAttributeSettings,
  resetRecord,
  adjustColumns,
}) => {
  let { currentRecordId, attributeId, showAttribute } = attributeSettings;
  const classes = useStyles();
  return (
    <Modal
      open={showAttribute}
      onClose={(event, reason) => {
        event.preventDefault();
        event.stopPropagation();
        setAttributeSettings({
          attributeId: undefined,
          showAttribute: false,
        });
        resetRecord();
      }}
      aria-labelledby="search-options-modal-title"
      aria-describedby="search-options-modal-description"
      className={classes.modal}
      container={() => document.getElementById("theme-base")}
    >
      <DialogContent className={classes.paper}>
        <AttributeModal
          attributeId={attributeId}
          currentRecordId={adjustColumns ? false : currentRecordId}
        />
      </DialogContent>
    </Modal>
  );
};

export default compose(withRecord)(ResultModalControl);
