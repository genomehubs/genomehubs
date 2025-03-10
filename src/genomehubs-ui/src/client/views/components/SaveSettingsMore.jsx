import React, { useState } from "react";
import {
  favListingButton as favListingButtonStyle,
  favListingContainer as favListingContainerStyle,
  favListingContent as favListingContentStyle,
  favListing as favListingStyle,
} from "./Styles.scss";

import ColorButton from "./ColorButton";
import EditIcon from "@mui/icons-material/Edit";
import MuiDialogContent from "@mui/material/DialogContent";
import PublishIcon from "@mui/icons-material/Publish";
import SaveIcon from "@mui/icons-material/SaveAlt";
import ToggleTheme from "./ToggleTheme";
import YamlEditor from "@focus-reactive/react-yaml";
import { compose } from "recompose";
import qs from "../functions/qs";
import { useLocalStorage } from "usehooks-ts";
import withSearchIndex from "../hocs/withSearchIndex";
import withStyles from "@mui/styles/withStyles";
import withTaxonomy from "../hocs/withTaxonomy";

const SaveSettingsDefaults = ({
  currentIndex,
  searchIndex,
  taxonomy,
  handleClose,
}) => {
  const DialogContent = withStyles((theme) => ({
    root: {
      padding: "16px",
    },
  }))(MuiDialogContent);

  const handleClear = () => {
    setSavedOptions({});
    setTimeout(() => {
      window.localStorage.removeItem(`${currentIndex}Options`);
    });
    handleClose();
  };

  return (
    <DialogContent dividers>
      <div className={favListingStyle}>
        <div className={favListingContainerStyle}>
          <div className={favListingContentStyle}>
            <ToggleTheme key={"theme"} />
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

export default compose(withTaxonomy, withSearchIndex)(SaveSettingsDefaults);
