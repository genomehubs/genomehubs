import {
  favListingContainer as favListingContainerStyle,
  favListingContent as favListingContentStyle,
  favListing as favListingStyle,
} from "./Styles.scss";

import MuiDialogContent from "@mui/material/DialogContent";
import ToggleTheme from "./ToggleTheme";
import { compose } from "redux";
import withSearchIndex from "#hocs/withSearchIndex";
import withStyles from "@mui/styles/withStyles";
import withTaxonomy from "#hocs/withTaxonomy";

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
