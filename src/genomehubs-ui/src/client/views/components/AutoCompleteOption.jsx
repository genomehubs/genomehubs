import CategoryIcon from "@material-ui/icons/Category";
import EmojiNatureIcon from "@material-ui/icons/EmojiNature";
import ExtensionIcon from "@material-ui/icons/Extension";
import FunctionsIcon from "@material-ui/icons/Functions";
import Grid from "@material-ui/core/Grid";
import LineStyleIcon from "@material-ui/icons/LineStyle";
import LooksOneIcon from "@material-ui/icons/LooksOne";
import PersonPinCircleIcon from "@material-ui/icons/PersonPinCircle";
import React from "react";
import SearchIcon from "@material-ui/icons/Search";
import TodayIcon from "@material-ui/icons/Today";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { useStyles } from "./SearchBox";

export const AutoCompleteOption = ({ option }) => {
  const classes = useStyles();
  let primaryText, secondaryText;
  let optionIcon = <SearchIcon className={classes.icon} />;
  if (option.result == "taxon") {
    optionIcon = <EmojiNatureIcon className={classes.icon} />;
  } else if (option.result == "assembly") {
    optionIcon = <ExtensionIcon className={classes.icon} />;
  } else if (option.result == "sample") {
    optionIcon = <PersonPinCircleIcon className={classes.icon} />;
  }
  if (option.name_class) {
    primaryText = (
      <>
        {option.xref && (
          <div style={{ display: "inline-block" }}>
            <Typography variant="body2" color="textSecondary">
              {`${option.name_class}:`}
            </Typography>
          </div>
        )}
        {option.xref && " "}
        {option.value}
      </>
    );
    secondaryText = (
      <Typography variant="body2" color="textSecondary">
        {option.taxon_rank}
        {option.name_class != "scientific name" &&
          option.name_class != "taxon ID" && (
            <span>: {option.scientific_name}</span>
          )}
      </Typography>
    );
  } else if (option.identifier_class) {
    if (option.result == "assembly" || option.result == "sample") {
      secondaryText = (
        <Typography variant="body2" color="textSecondary">
          {option.scientific_name}
        </Typography>
      );
    } else {
      secondaryText = (
        <Typography variant="body2" color="textSecondary">
          {option.feature_id}
        </Typography>
      );
    }
  } else if (option.type) {
    if (option.type == "rank") {
      optionIcon = (
        <LineStyleIcon
          className={classes.icon}
          style={{ transform: "rotate(-90deg)" }}
        />
      );
    } else if (option.type == "date") {
      optionIcon = <TodayIcon className={classes.icon} />;
    } else if (option.type == "keyword") {
      optionIcon = <CategoryIcon className={classes.icon} />;
    } else if (option.type == "operator") {
      optionIcon = <FunctionsIcon className={classes.icon} />;
    } else {
      optionIcon = <LooksOneIcon className={classes.icon} />;
    }
    primaryText = option.display_value || option.unique_term;
    secondaryText = (
      <Typography variant="body2" color="textSecondary">
        {option.type}
      </Typography>
    );
  }

  let item = (
    <Grid item xs>
      <div>{primaryText}</div>
      <span style={{ float: "right" }}>
        <Typography variant="body2" color="textSecondary">
          {(option.name_class && option.taxon_id) ||
            option.assembly_id ||
            option.description ||
            option.name}
        </Typography>
      </span>
      {secondaryText}
    </Grid>
  );

  return (
    <Grid container alignItems="center">
      <Grid item>{optionIcon}</Grid>
      {item}
    </Grid>
  );
};

export default AutoCompleteOption;
