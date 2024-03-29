import AttributeModal from "./AttributeModal";
import DialogContent from "@material-ui/core/DialogContent";
import Modal from "@material-ui/core/Modal";
import React from "react";
import { attributeSettings } from "../reducers/record";
import { compose } from "recompose";
import { useStyles } from "./ResultTable";
import withRecord from "../hocs/withRecord";

export const ResultModalControl = ({
  attributeSettings,
  setAttributeSettings,
  resetRecord,
  adjustColumns,
  rootRef,
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
