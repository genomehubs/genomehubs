import Grid from "@mui/material/Grid";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import React from "react";
import Typography from "@mui/material/Typography";
import { useStyles } from "./SearchBoxStyles";

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
