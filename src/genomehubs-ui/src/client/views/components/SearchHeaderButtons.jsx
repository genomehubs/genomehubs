import React, { useState } from "react";

import FavoriteBorderIcon from "@material-ui/icons/FavoriteBorder";
import FavoriteIcon from "@material-ui/icons/Favorite";
import IconButton from "@material-ui/core/IconButton";
import SaveSettingsModal from "./SaveSettingsModal";
import SettingsApplicationsIcon from "@material-ui/icons/SettingsApplications";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import styles from "./Styles.scss";
import { useLocalStorage } from "usehooks-ts";
import withSearch from "../hocs/withSearch";

const reportParams = {
  report: false,
  y: false,
  z: false,
  cat: false,
  pointSize: 15,
  rank: false,
  stacked: false,
  yScale: "linear",
  cumulative: false,
  compactLegend: false,
  catToX: false,
};

const searchParams = {
  query: false,
  result: false,
  includeEstimates: "false",
  summaryValues: "count",
  taxonomy: "ncbi",
  size: 10,
  offset: 0,
  fields: "",
  names: "",
  ranks: "",
};

export const splitTerms = (terms) => {
  let searchTerm = {};
  let reportTerm = {};
  for (let key in terms) {
    if (reportParams[key] !== undefined) {
      if (reportParams[key] === false) {
        reportTerm[key] = terms[key];
      } else if (reportParams[key] != terms[key]) {
        reportTerm[key] = terms[key];
      }
    } else if (searchParams.hasOwnProperty(key)) {
      if (searchParams[key] != terms[key]) {
        searchTerm[key] = terms[key];
      }
    } else {
      searchTerm[key] = terms[key];
    }
  }
  return { searchTerm, reportTerm: reportTerm.report ? reportTerm : undefined };
};

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
    favButton = favouriteButton({
      isFavourite,
      handleClickFavourite,
      name,
      color,
    });
  }

  let settingsButton = (
    <Tooltip title="Search settings" arrow placement={"top"}>
      <IconButton
        className={styles.saveSearchOptions}
        aria-label="search settings"
        onClick={() => setOpen(!open)}
      >
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

export const favouriteButton = ({
  isFavourite,
  handleClickFavourite,
  color = "inherit",
}) => {
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
        {isFavourite ? (
          <FavoriteIcon style={{ color }} />
        ) : (
          <FavoriteBorderIcon style={{ color }} />
        )}
      </IconButton>
    </Tooltip>
  );
};
