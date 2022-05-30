import Grid from "@material-ui/core/Grid";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import React from "react";
import Typography from "@material-ui/core/Typography";
import { useStyles } from "./SearchBox";

export const AutoCompleteSuggestion = ({ option }) => {
  const classes = useStyles();
  return (
    <Grid container alignItems="center">
      <Grid item>
        <HelpOutlineIcon className={classes.icon} />
      </Grid>
      <Grid item xs>
        <Typography variant="body2" color="textSecondary">
          Did you mean
        </Typography>
        <div>{option.value}</div>
      </Grid>
    </Grid>
  );
};

export default AutoCompleteSuggestion;
