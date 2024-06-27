import React, { useRef, useState } from "react";

import FavoriteBorderIcon from "@material-ui/icons/FavoriteBorder";
import FavoriteIcon from "@material-ui/icons/Favorite";
import IconButton from "@material-ui/core/IconButton";
import SaveSettingsModal from "./SaveSettingsModal";
import SettingsApplicationsIcon from "@material-ui/icons/SettingsApplications";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import { makeStyles } from "@material-ui/core/styles";
import styles from "./Styles.scss";
import { useLocalStorage } from "usehooks-ts";
import { useLocation } from "@reach/router";
import withSearch from "../hocs/withSearch";

const SearchHeaderButtons = ({ rootRef, searchIndex, searchTerm }) => {
  const [open, setOpen] = useState(false);

  const [favourites, setFavourites] = useLocalStorage(
    `${searchIndex}Favourites`,
    {}
  );
  // const rootRef = useRef(null);
  const stringTerm = JSON.stringify(searchTerm);
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

  let favButton = favouriteButton(isFavourite, handleClickFavourite);

  let settingsButton = (
    <Tooltip title="Save search settings" arrow placement={"top"}>
      <IconButton
        className={styles.saveSearchOptions}
        aria-label="save search settings"
        onClick={() => setOpen(!open)}
      >
        <SettingsApplicationsIcon />
      </IconButton>
    </Tooltip>
  );

  return (
    <>
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

export const favouriteButton = (isFavourite, handleClickFavourite) => {
  return (
    <Tooltip
      title={
        isFavourite
          ? "remove search from favourites"
          : "add search to favourites"
      }
      arrow
      placement={"top"}
    >
      <IconButton
        className={styles.saveSearchOptions}
        aria-label="save search to favourites"
        onClick={handleClickFavourite}
      >
        {isFavourite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
      </IconButton>
    </Tooltip>
  );
};
