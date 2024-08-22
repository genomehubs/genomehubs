import React, { memo } from "react";

import { Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import { compose } from "recompose";
import makeStyles from '@mui/styles/makeStyles';
import qs from "qs";
import styles from "./Styles.scss";
import { useLocation } from "@reach/router";
import withColors from "../hocs/withColors";

const useStyles = makeStyles((theme) => ({
  paper: {
    backgroundColor: "rgb(49, 50, 63)",
    minWidth: "20em",
    padding: "0.5em",
    overflow: "auto",
    scrollbarGutter: "stable both-edges",
    fontFamily: '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
    color: "white",
  },
}));

export const PalettePreview = ({ colors, size = "2em" }) => {
  return colors.map((col, i) => (
    <span
      style={{
        backgroundColor: col,
        height: size,
        width: size,
        display: "inline-block",
      }}
      key={i}
    ></span>
  ));
};

const PalettePicker = ({ palettes, handleClick }) => {
  const classes = useStyles();
  let palettePreviews = Object.entries(palettes.byId).map(([id, palette]) => {
    let colors =
      palette.default.length > 6
        ? palette[6] || palette.default.slice(0, 6)
        : palette.default.slice(0, 6);
    let preview = <PalettePreview colors={colors}></PalettePreview>;

    return (
      <Grid item key={id}>
        <Grid
          container
          direction="row"
          alignItems="center"
          spacing={1}
          style={{ cursor: handleClick ? "pointer" : "auto" }}
          onClick={handleClick ? () => handleClick(id) : () => {}}
        >
          <Grid item>{id}</Grid>
          <Grid item>{preview}</Grid>
        </Grid>
      </Grid>
    );
  });

  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="flex-end"
      justifyContent="flex-end"
      className={classes.paper}
    >
      {palettePreviews}
    </Grid>
  );
};

export default compose(memo, withColors)(PalettePicker);
