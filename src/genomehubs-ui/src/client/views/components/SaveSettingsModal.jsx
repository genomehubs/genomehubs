import React, { useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import FavoriteIcon from "@mui/icons-material/Favorite";
import IconButton from "@mui/material/IconButton";
import ListIcon from "@mui/icons-material/List";
import MuiDialogActions from "@mui/material/DialogActions";
import MuiDialogContent from "@mui/material/DialogContent";
import MuiDialogTitle from "@mui/material/DialogTitle";
import MuiTab from "@mui/material/Tab";
import MuiTabs from "@mui/material/Tabs";
import SaveSettingsDefaults from "./SaveSettingsDefaults";
import SaveSettingsFavourites from "./SaveSettingsFavourites";
// import SaveSettingsLists from "./SaveSettingsLists";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import Typography from "@mui/material/Typography";
import { compose } from "recompose";
import makeStyles from "@mui/styles/makeStyles";
import styles from "./Styles.scss";
import withSearchIndex from "../hocs/withSearchIndex";
import withStyles from "@mui/styles/withStyles";
import withTaxonomy from "../hocs/withTaxonomy";

export const useStyles = makeStyles((theme) => ({
  paper: {
    boxShadow: "none",
  },
  formControl: {
    margin: 16,
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: 16,
  },
  label: {
    color: "rgba(0, 0, 0, 0.54)",
  },
}));

const wantedIndices = new Set(["taxon", "assembly", "sample", "feature"]);

const SaveSettingsModal = ({ rootRef, searchIndex, indices, handleClose }) => {
  const classes = useStyles();
  const [tabValue, setTabValue] = useState(0);
  const activeIndices = indices.filter((index) => wantedIndices.has(index));

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const [secondaryTabValue, setSecondaryTabValue] = useState(
    activeIndices.indexOf(searchIndex)
  );

  const handleSecondaryTabChange = (event, newValue) => {
    setSecondaryTabValue(newValue);
  };

  const customStyles = (theme) => ({
    root: {
      margin: 0,
      padding: 16,
    },
    closeButton: {
      position: "absolute",
      right: 8,
      top: 8,
      color: "#bdbdbd", // theme.palette.grey[500],
    },
  });

  const DialogTitle = withStyles(customStyles)((props) => {
    const { children, classes, onClose, ...other } = props;
    return (
      <MuiDialogTitle disableTypography className={classes.root} {...other}>
        <Typography variant="h6">{children}</Typography>
        {onClose ? (
          <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={onClose}
            size="large"
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </MuiDialogTitle>
    );
  });

  const DialogContent = withStyles((theme) => ({
    root: {
      padding: 16,
    },
  }))(MuiDialogContent);

  const DialogActions = withStyles((theme) => ({
    root: {
      margin: 0,
      padding: 8,
    },
  }))(MuiDialogActions);

  let favListings = [];

  return (
    <Dialog
      open={true}
      onClose={handleClose}
      aria-labelledby="save-settings-modal-title"
      aria-describedby="save-settings-modal-description"
      className={classes.modal}
      container={() => rootRef.current}
      maxWidth={"lg"}
      scroll={"body"}
      // fullWidth={true}
    >
      <DialogContent className={classes.paper}>
        <MuiTabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          // textColor="default"
          aria-label="icon label tabs example"
        >
          <MuiTab icon={<FavoriteIcon />} label="FAVORITES" />
          <MuiTab icon={<SettingsApplicationsIcon />} label="DEFAULTS" />
          <MuiTab icon={<ListIcon />} label="LISTS" />
        </MuiTabs>
        <MuiTabs
          value={secondaryTabValue}
          onChange={handleSecondaryTabChange}
          indicatorColor="secondary"
          // textColor="default"
          aria-label="icon label tabs example"
        >
          {activeIndices.map((index) => (
            <MuiTab key={index} label={index} />
          ))}
        </MuiTabs>
        {/* <DialogTitle id="customized-dialog-title" onClose={handleClose}>
          Search Settings
        </DialogTitle> */}
        {tabValue == 0 && (
          <SaveSettingsFavourites
            currentIndex={activeIndices[secondaryTabValue]}
          />
        )}
        {tabValue == 1 && (
          <SaveSettingsDefaults
            currentIndex={activeIndices[secondaryTabValue]}
          />
        )}

        <DialogActions>
          <span className={styles.favListingFooter}>
            Save any changes before closing or changing tabs. Changes will be
            lost if you navigate away.
          </span>
        </DialogActions>
        {/* <Paper className={classes.paper}>
          <Grid container alignItems="center" direction="column" spacing={2}>
            <Grid container direction="row">
              <SaveSettingsPanel handleClose={handleClose} />
            </Grid>
            <Grid
              container
              alignItems="center"
              direction="row"
              spacing={2}
            ></Grid>
          </Grid>
        </Paper> */}
      </DialogContent>
    </Dialog>
  );
};

export default compose(withTaxonomy, withSearchIndex)(SaveSettingsModal);
