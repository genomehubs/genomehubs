import React, { useEffect, useState } from "react";

import ClearIcon from "@material-ui/icons/Clear";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import SaveIcon from "@material-ui/icons/Save";
import classnames from "classnames";
import { compose } from "recompose";
import qs from "qs";
import styles from "./Styles.scss";
import { useLocalStorage } from "usehooks-ts";
import withSearch from "../hocs/withSearch";
import withTaxonomy from "../hocs/withTaxonomy";

const SaveSettingsPanel = ({
  searchIndex,
  searchTerm,
  taxonomy,
  handleClose,
  title = "Save search settings",
}) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );
  let options = qs.parse(location.search.replace(/^\?/, ""));

  const [savedOptions, setSavedOptions] = useLocalStorage(
    `${searchIndex}Options`,
    {}
  );
  const handleClick = (e) => {
    let currentOptions = {
      result: options.result,
      size: options.size || 10,
      includeEstimates: Boolean(options.includeEstimates),
      taxonomy,
    };
    ["fields", "names", "ranks"].forEach((key) => {
      currentOptions[key] = options[key] ? options[key].split(",") : [];
    });
    if (options.sortBy) {
      currentOptions.sortBy = options.sortBy;
      currentOptions.sortOrder = options.sortOrder || "asc";
    }
    ["Ancestral", "Descendant", "Direct", "Missing"].forEach((key) => {
      let keyName = `exclude${key}`;
      if (options.hasOwnProperty(keyName))
        currentOptions[keyName] = options[keyName];
    });
    setSavedOptions(currentOptions);
    handleClose();
  };

  const handleClear = () => {
    setSavedOptions({});
    setTimeout(() => {
      window.localStorage.removeItem(`${searchIndex}Options`);
    });
    handleClose();
  };

  let content = (
    <Grid item xs={12}>
      <Grid container direction="column">
        <Grid item>
          <Grid container direction="row" alignItems={"flex-end"}>
            <Grid item xs={2}>
              <IconButton
                // className={classes.saveSearchOptions}
                aria-label="save search settings"
                onClick={handleClick}
              >
                Save
                <SaveIcon />
              </IconButton>
            </Grid>
            <Grid item xs={10}>
              Click to save current search options to your browser. This
              information will only be used to apply the current search options
              to future searches. No personal data will be collected.
            </Grid>
          </Grid>
        </Grid>
        <Grid item>
          <Grid container direction="row" alignItems={"flex-end"}>
            <Grid item xs={2}>
              <IconButton
                // className={classes.saveSearchOptions}
                aria-label="save search settings"
                onClick={handleClear}
              >
                Clear
                <ClearIcon />
              </IconButton>
            </Grid>
            <Grid item xs={10}>
              Click to clear saved search options from your browser.
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );

  return (
    <div className={css}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
      </div>
      <div>{content}</div>
    </div>
  );
};

export default compose(withTaxonomy, withSearch)(SaveSettingsPanel);
