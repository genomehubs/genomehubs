import React, { useEffect, useState } from "react";

import Button from "@material-ui/core/Button";
import EditIcon from "@material-ui/icons/Edit";
import MuiDialogContent from "@material-ui/core/DialogContent";
import PublishIcon from "@material-ui/icons/Publish";
import SaveIcon from "@material-ui/icons/SaveAlt";
import YamlEditor from "@focus-reactive/react-yaml";
import classnames from "classnames";
import { compose } from "recompose";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import { useLocalStorage } from "usehooks-ts";
import withSearchIndex from "../hocs/withSearchIndex";
import { withStyles } from "@material-ui/core/styles";
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
      padding: theme.spacing(2),
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
      <pre key={key} className={styles.favListing}>
        <b>{key}:</b> {JSON.stringify(value)}
      </pre>
    ));
  }

  return (
    <DialogContent dividers>
      <div className={styles.favListing}>
        <div className={styles.favListingContainer}>
          <div className={styles.favListingContent}>{defaults}</div>
          <div className={styles.favListingButton}>
            {urlOptions &&
              JSON.stringify(urlOptions) != JSON.stringify(currentOptions) && (
                <Button
                  autoFocus
                  color="primary"
                  // variant="outlined"
                  startIcon={<PublishIcon />}
                  onClick={() => setCurrentOptions(urlOptions)}
                >
                  use current
                </Button>
              )}
            <Button
              autoFocus
              color="primary"
              // variant="outlined"
              startIcon={<EditIcon />}
              onClick={toggleEdit}
            >
              edit
            </Button>
            {(changed.value ||
              JSON.stringify(savedOptions) !=
                JSON.stringify(currentOptions)) && (
              <Button
                autoFocus
                color="primary"
                // variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSave}
              >
                save changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

export default compose(withTaxonomy, withSearchIndex)(SaveSettingsDefaults);
