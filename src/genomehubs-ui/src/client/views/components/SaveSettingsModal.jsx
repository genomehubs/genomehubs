import { Suspense, lazy, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import FavoriteIcon from "@mui/icons-material/Favorite";
import IconButton from "@mui/material/IconButton";
import ListIcon from "@mui/icons-material/List";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import MuiDialogActions from "@mui/material/DialogActions";
import MuiDialogContent from "@mui/material/DialogContent";
import MuiDialogTitle from "@mui/material/DialogTitle";
import MuiTab from "@mui/material/Tab";
import MuiTabs from "@mui/material/Tabs";
import SaveSettingsDefaults from "./SaveSettingsDefaults";
import SaveSettingsMore from "./SaveSettingsMore";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import Typography from "@mui/material/Typography";
import { compose } from "redux";
import { favListingFooter as favListingFooterStyle } from "./Styles.scss";
import makeStyles from "@mui/styles/makeStyles";
import withSearchIndex from "#hocs/withSearchIndex";
import withStyles from "@mui/styles/withStyles";
import withTaxonomy from "#hocs/withTaxonomy";

// Lazy load favourites to defer export libraries
const SaveSettingsFavourites = lazy(() => import("./SaveSettingsFavourites"));

export const useStyles = makeStyles((theme) => ({
  paper: {
    boxShadow: "none",
    backgroundColor: theme.palette.background.default,
  },
  formControl: {
    margin: "16px",
    minWidth: "120px",
  },
  selectEmpty: {
    marginTop: "16px",
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
    activeIndices.indexOf(searchIndex),
  );

  const handleSecondaryTabChange = (event, newValue) => {
    setSecondaryTabValue(newValue);
  };

  const customStyles = (theme) => ({
    root: {
      margin: "0px",
      padding: "16px",
    },
    closeButton: {
      position: "absolute",
      right: 8,
      top: 8,
      color: theme.palette.text.primary,
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
      padding: "16px",
    },
  }))(MuiDialogContent);

  const DialogActions = withStyles((theme) => ({
    root: {
      margin: "0px",
      padding: "8px",
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
          <MuiTab icon={<MoreHorizIcon />} label="MORE" />
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
          <Suspense
            fallback={
              <div style={{ padding: "2rem", textAlign: "center" }}>
                Loading favourites...
              </div>
            }
          >
            <SaveSettingsFavourites
              currentIndex={activeIndices[secondaryTabValue]}
            />
          </Suspense>
        )}
        {tabValue == 1 && (
          <SaveSettingsDefaults
            currentIndex={activeIndices[secondaryTabValue]}
          />
        )}
        {tabValue == 3 && <SaveSettingsMore />}

        <DialogActions>
          <span className={favListingFooterStyle}>
            Save any changes before closing or changing tabs. Changes will be
            lost if you navigate away.
          </span>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default compose(withTaxonomy, withSearchIndex)(SaveSettingsModal);
