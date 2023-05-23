import React, { memo, useEffect, useRef, useState } from "react";

import DialogContent from "@material-ui/core/DialogContent";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Modal from "@material-ui/core/Modal";
import SaveSettingsModal from "./SaveSettingsModal";
import SearchBox from "./SearchBox";
import SettingsApplicationsIcon from "@material-ui/icons/SettingsApplications";
import Tooltip from "@material-ui/core/Tooltip";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchColors from "../hocs/dispatchColors";
import { makeStyles } from "@material-ui/core/styles";
import qs from "qs";
import styles from "./Styles.scss";
import { useLocation } from "@reach/router";
import { useReadLocalStorage } from "usehooks-ts";
import withApi from "../hocs/withApi";
import withSearchIndex from "../hocs/withSearchIndex";

const useStyles = makeStyles((theme) => ({
  container: {
    minHeight: "100%",
    minWidth: "100%",
    maxWidth: "100%",
  },
  item: { minWidth: "900px", maxWidth: "80%", align: "center" },
  itemFull: { width: "100%", align: "center" },
  saveSearchOptions: {
    fontSize: "2em",
    marginLeft: theme.spacing(1),
    backgroundColor: "inherit",
    padding: 0,
  },
}));

const Page = ({
  searchBox,
  panels,
  text,
  topLevel,
  searchIndex,
  pageRef,
  recordId,
  fieldId,
  resultCount,
  result,
  selectPalette,
  apiStatus,
}) => {
  const classes = useStyles();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const savedOptions = useReadLocalStorage(`${searchIndex}Options`);
  const itemCss = topLevel ? classes.itemFull : classes.item;
  let options = qs.parse(location.search.replace(/^\?/, ""));
  useEffect(() => {
    selectPalette(options.palette || "default");
  }, []);
  if (!apiStatus) {
    return null;
  }
  let items = [];
  if (panels && panels.length > 0) {
    panels.forEach((obj, i) => {
      let styles = {};
      Object.keys(obj).forEach((key) => {
        if (key != "panel") {
          styles[key] = obj[key];
        }
      });
      items.push(
        <Grid item className={itemCss} style={styles} key={i}>
          {obj.panel}
        </Grid>
      );
    });
  }
  let title;
  let button;
  if (recordId && result) {
    title = `${result} record ${recordId}`;
  } else if (fieldId) {
    title = `${fieldId} summary`;
  } else if (resultCount >= 0) {
    title = `${resultCount} ${resultCount == 1 ? "hit" : "hits"}`;
    button = (
      <Tooltip title="Save search settings" arrow placement={"top"}>
        <IconButton
          className={classes.saveSearchOptions}
          aria-label="save search settings"
          onClick={() => setOpen(!open)}
        >
          <SettingsApplicationsIcon />
        </IconButton>
      </Tooltip>
    );
  } else if (resultCount < 0) {
    title = `updating search results...`;
  }
  return (
    <Grid
      container
      spacing={2}
      direction="column"
      alignItems="center"
      justifyContent="center"
      className={classes.container}
      ref={pageRef}
    >
      {searchBox && (
        <Grid item className={itemCss} style={{ marginTop: "2em" }}>
          <SearchBox />
        </Grid>
      )}
      {title && (
        <Grid
          item
          className={classnames(styles.pageTitle, itemCss)}
          style={{ marginBottom: "0.5em" }}
          container
          direction="row"
          ref={rootRef}
        >
          <Grid item xs={11}>
            {title}
          </Grid>
          {button && (
            <Grid item xs={1} style={{ textAlign: "end" }}>
              {button}
              <Modal
                open={open}
                onClose={(event, reason) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setOpen(false);
                }}
                aria-labelledby="save-settings-modal-title"
                aria-describedby="save-settings-modal-description"
                className={classes.modal}
                container={() => rootRef.current}
              >
                <DialogContent className={classes.paper}>
                  <SaveSettingsModal handleClose={() => setOpen(false)} />
                </DialogContent>
              </Modal>
            </Grid>
          )}
        </Grid>
      )}
      {items}
      {text && (
        <Grid item className={itemCss}>
          {text}
        </Grid>
      )}
    </Grid>
  );
};

export default compose(memo, dispatchColors, withApi, withSearchIndex)(Page);
