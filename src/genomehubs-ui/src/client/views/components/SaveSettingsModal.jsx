import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import React from "react";
import SaveSettingsPanel from "./SaveSettingsPanel";
import { compose } from "recompose";
import { makeStyles } from "@material-ui/core/styles";

export const useStyles = makeStyles((theme) => ({
  paper: {
    width: "96%",
    minWidth: "600px",
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    boxShadow: "none",
  },
  formControl: {
    margin: theme.spacing(2),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  label: {
    color: "rgba(0, 0, 0, 0.54)",
  },
}));

const SaveSettingsModal = ({ handleClose }) => {
  const classes = useStyles();

  return (
    <Paper className={classes.paper}>
      <Grid container alignItems="center" direction="column" spacing={2}>
        <Grid container direction="row">
          <SaveSettingsPanel handleClose={handleClose} />
        </Grid>
        <Grid container alignItems="center" direction="row" spacing={2}></Grid>
      </Grid>
    </Paper>
  );
};

export default SaveSettingsModal;
