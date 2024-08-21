import React, { useState } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";

import CloseIcon from "@material-ui/icons/Close";
import Dialog from "@material-ui/core/Dialog";
import FavoriteIcon from "@material-ui/icons/Favorite";
import IconButton from "@material-ui/core/IconButton";
import ListIcon from "@material-ui/icons/List";
import MuiDialogActions from "@material-ui/core/DialogActions";
import MuiDialogContent from "@material-ui/core/DialogContent";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import MuiTab from "@material-ui/core/Tab";
import MuiTabs from "@material-ui/core/Tabs";
import SaveSettingsDefaults from "./SaveSettingsDefaults";
import SaveSettingsFavourites from "./SaveSettingsFavourites";
// import SaveSettingsLists from "./SaveSettingsLists";
import SettingsApplicationsIcon from "@material-ui/icons/SettingsApplications";
import Typography from "@material-ui/core/Typography";
import { compose } from "recompose";
import styles from "./Styles.scss";
import withSearchIndex from "../hocs/withSearchIndex";
import withTaxonomy from "../hocs/withTaxonomy";

export const useStyles = makeStyles((theme) => ({
  paper: {
    boxShadow: "none",
  },
  formControl: {
    margin: theme.spacing(2),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
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
      padding: theme.spacing(2),
    },
    closeButton: {
      position: "absolute",
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
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
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </MuiDialogTitle>
    );
  });

  const DialogContent = withStyles((theme) => ({
    root: {
      padding: theme.spacing(2),
    },
  }))(MuiDialogContent);

  const DialogActions = withStyles((theme) => ({
    root: {
      margin: 0,
      padding: theme.spacing(1),
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
