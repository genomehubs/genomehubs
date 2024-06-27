import React, { useEffect, useState } from "react";

import MuiDialogContent from "@material-ui/core/DialogContent";
import YAML from "yaml";
import classnames from "classnames";
import { compose } from "recompose";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import { useLocalStorage } from "usehooks-ts";
import { withStyles } from "@material-ui/core/styles";
import withTaxonomy from "../hocs/withTaxonomy";

const SaveSettingsDefaults = ({
  currentIndex,
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
    `${currentIndex}Options`,
    {}
  );

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
    if (options.hasOwnProperty(keyName)) {
      currentOptions[keyName] = options[keyName];
    }
  });
  const searchDefaultsDoc = new YAML.Document();
  searchDefaultsDoc.contents = currentOptions;

  const DialogContent = withStyles((theme) => ({
    root: {
      padding: theme.spacing(2),
    },
  }))(MuiDialogContent);

  let defaults = searchDefaultsDoc
    .toString()
    .split("\n")
    .map((line, i) => (
      <pre key={i} className={styles.favListingExtra}>
        {line}
      </pre>
    ));
  // setSavedOptions(currentOptions);

  const handleClear = () => {
    setSavedOptions({});
    setTimeout(() => {
      window.localStorage.removeItem(`${currentIndex}Options`);
    });
    handleClose();
  };

  // let content = (
  //   <Grid item xs={12}>
  //     <Grid container direction="column">
  //       <Grid item>
  //         <Grid container direction="row" alignItems={"flex-end"}>
  //           <Grid item xs={2}>
  //             <IconButton
  //               // className={classes.saveSearchOptions}
  //               aria-label="save search settings"
  //               onClick={handleClick}
  //             >
  //               Save
  //               <SaveIcon />
  //             </IconButton>
  //           </Grid>
  //           <Grid item xs={10}>
  //             Click to save current search options to your browser. This
  //             information will only be used to apply the current search options
  //             to future searches. No personal data will be collected.
  //           </Grid>
  //         </Grid>
  //       </Grid>
  //       <Grid item>
  //         <Grid container direction="row" alignItems={"flex-end"}>
  //           <Grid item xs={2}>
  //             <IconButton
  //               // className={classes.saveSearchOptions}
  //               aria-label="save search settings"
  //               onClick={handleClear}
  //             >
  //               Clear
  //               <ClearIcon />
  //             </IconButton>
  //           </Grid>
  //           <Grid item xs={10}>
  //             Click to clear saved search options from your browser.
  //           </Grid>
  //         </Grid>
  //       </Grid>
  //     </Grid>
  //   </Grid>
  // );

  return (
    <DialogContent dividers>
      <div className={styles.favListing}>
        <div className={styles.favListingContainer}>
          <div className={styles.favListingContent}>{defaults}</div>
        </div>
      </div>
    </DialogContent>
  );
};

export default compose(withTaxonomy)(SaveSettingsDefaults);
