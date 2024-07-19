import FavoriteBorderIcon from "@material-ui/icons/FavoriteBorder";
import FavoriteIcon from "@material-ui/icons/Favorite";
import IconButton from "@material-ui/core/IconButton";
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

export default FavouriteButton;
