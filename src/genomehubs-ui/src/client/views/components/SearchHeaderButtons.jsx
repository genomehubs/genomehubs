import React, { useState } from "react";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavouriteButton from "./FavouriteButton";
import IconButton from "@mui/material/IconButton";
import SaveSettingsModal from "./SaveSettingsModal";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import { splitTerms } from "../functions/splitTerms";
import styles from "./Styles.scss";
import { useLocalStorage } from "usehooks-ts";
import withSearch from "../hocs/withSearch";

const SearchHeaderButtons = ({
  rootRef,
  searchIndex,
  searchTerm: urlTerm,
  showFavourite,
  showName,
  color = "inherit",
}) => {
  const [open, setOpen] = useState(false);

  const [favourites, setFavourites] = useLocalStorage(
    `${searchIndex}Favourites`,
    {}
  );

  const { searchTerm, reportTerm } = splitTerms(urlTerm);
  const stringTerm = JSON.stringify({ ...searchTerm, ...reportTerm });
  const [isFavourite, setIsFavourite] = useState(
    favourites[stringTerm] || false
  );

  const handleClickFavourite = () => {
    if (isFavourite) {
      let newFavourites = { ...favourites };
      delete newFavourites[stringTerm];
      setFavourites(newFavourites);
    } else {
      let newFavourites = { ...favourites };
      newFavourites[stringTerm] = true;
      setFavourites(newFavourites);
    }
    setIsFavourite(!isFavourite);
  };

  let favButton;
  let favName;
  if (showFavourite) {
    if (showName && favourites[stringTerm] !== true) {
      favName = (
        <span className={styles.favListingFooter}>
          {favourites[stringTerm]}
        </span>
      );
    }
    favButton = (
      <FavouriteButton
        isFavourite={isFavourite}
        handleClickFavourite={handleClickFavourite}
        color={color}
      />
    );
  }

  let settingsButton = (
    <Tooltip title="Search settings" arrow placement={"top"}>
      <IconButton
        className={styles.saveSearchOptions}
        aria-label="search settings"
        onClick={() => setOpen(!open)}
        size="large">
        <SettingsApplicationsIcon style={{ color }} />
      </IconButton>
    </Tooltip>
  );

  return (
    <>
      {favName}
      {favButton}
      {settingsButton}
      {open && (
        <SaveSettingsModal
          rootRef={rootRef}
          handleClose={(event, reason) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }}
        />
      )}
    </>
  );
};

export default compose(withSearch)(SearchHeaderButtons);
