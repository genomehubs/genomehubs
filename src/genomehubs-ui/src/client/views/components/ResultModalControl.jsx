import AttributeModal from "./AttributeModal";
import DialogContent from "@material-ui/core/DialogContent";
import Modal from "@material-ui/core/Modal";
import React from "react";
import { compose } from "recompose";
import { makeStyles } from "@material-ui/core/styles";
import withRecord from "../hocs/withRecord";

export const useStyles = makeStyles((theme) => ({
  modal: {
    display: "flex",
    padding: theme.spacing(1),
    alignItems: "center",
    justifyContent: "center",
  },
  paper: {
    width: 400,
    maxWidth: "75vw",
    maxHeight: "75vh",
    backgroundColor: theme.palette.background.paper,
    border: "2px solid #000",
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
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
