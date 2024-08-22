import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import IconButton from "@mui/material/IconButton";
import React from "react";
import Tooltip from "./Tooltip";
import styles from "./Styles.scss";

export const FavouriteButton = ({
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
        size="large">
        {isFavourite ? (
          <FavoriteIcon style={{ color }} />
        ) : (
          <FavoriteBorderIcon style={{ color }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default FavouriteButton;
