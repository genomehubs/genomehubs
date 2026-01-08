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
import YamlEditor from "@focus-reactive/react-yaml";
import { compose } from "redux";
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
  let options = qs.parse(location.search.replace(/^\?/, ""));
  const [savedOptions, setSavedOptions] = useLocalStorage(
    `${currentIndex}Options`,
    {}
  );
  const [currentOptions, setCurrentOptions] = useState(savedOptions);
  const [edit, setEdit] = useState(false);
  let changed = {};

  const handleChange = ({ json }) => {
    changed.value = json;
  };

  const handleSave = () => {
    setSavedOptions(changed.value || currentOptions);
  };

  const toggleEdit = () => {
    if (edit) {
      setCurrentOptions(changed.value || {});
      delete changed.value;
    }
    setEdit(!edit);
  };

  let urlOptions;
  if (currentIndex == searchIndex) {
    urlOptions = {
      size: options.size || 10,
      includeEstimates: Boolean(options.includeEstimates),
      taxonomy,
    };
    ["fields", "names", "ranks"].forEach((key) => {
      urlOptions[key] = options[key] ? options[key].split(",") : [];
    });
    if (options.sortBy) {
      urlOptions.sortBy = options.sortBy;
      urlOptions.sortOrder = options.sortOrder || "asc";
    }
    ["Ancestral", "Descendant", "Direct", "Missing"].forEach((key) => {
      let keyName = `exclude${key}`;
      if (options.hasOwnProperty(keyName)) {
        urlOptions[keyName] = options[keyName];
      }
    });
  }

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

  let defaults;
  if (edit) {
    defaults = [
      <YamlEditor key={"edit"} json={currentOptions} onChange={handleChange} />,
    ];
  } else {
    defaults = Object.entries(currentOptions).map(([key, value]) => (
      <pre key={key} className={favListingStyle}>
        <b>{key}:</b> {JSON.stringify(value)}
      </pre>
    ));
  }

  return (
    <DialogContent dividers>
      <div className={favListingStyle}>
        <div className={favListingContainerStyle}>
          <div className={favListingContentStyle}>{defaults}</div>
          <div className={favListingButtonStyle}>
            {urlOptions &&
              JSON.stringify(urlOptions) != JSON.stringify(currentOptions) && (
                <ColorButton
                  autoFocus
                  color="primary"
                  // variant="outlined"
                  startIcon={<PublishIcon />}
                  onClick={() => setCurrentOptions(urlOptions)}
                >
                  use current
                </ColorButton>
              )}
            <ColorButton
              autoFocus
              color="primary"
              // variant="outlined"
              startIcon={<EditIcon />}
              onClick={toggleEdit}
            >
              edit
            </ColorButton>
            {(changed.value ||
              JSON.stringify(savedOptions) !=
                JSON.stringify(currentOptions)) && (
              <ColorButton
                autoFocus
                color="primary"
                // variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSave}
              >
                save changes
              </ColorButton>
            )}
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

export default compose(withTaxonomy, withSearchIndex)(SaveSettingsDefaults);
