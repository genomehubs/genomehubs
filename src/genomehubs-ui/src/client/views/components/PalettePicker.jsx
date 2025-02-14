import Grid from "@mui/material/Grid2";
import PalettePreview from "./PalettePreview";
import React from "react";
import { compose } from "recompose";
import makeStyles from "@mui/styles/makeStyles";
import withColors from "#hocs/withColors";

const useStyles = makeStyles((theme) => ({
  paper: {
    // minWidth: "20em",
    padding: "1em",
    overflow: "auto",
    scrollbarGutter: "stable both-edges",
    fontFamily: '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
    color: "white",
  },
}));

const PalettePicker = ({
  palettes,
  handleClick,
  size = "2em",
  swatches,
  borderRadius = 0,
  margin = "0em",
  showTooltip = false,
  theme = "dark",
}) => {
  const classes = useStyles();

  let darkColor = "#31323f";
  let lightColor = "#ffffff";
  let backgroundColor = theme === "dark" ? darkColor : lightColor;

  let textColor = theme === "dark" ? lightColor : darkColor;
  let highlightColor = theme === "dark" ? "#7f7f7f" : "#dfdfdf";

  let palettePreviews = Object.entries(palettes.byId).map(([id, palette]) => {
    let colors = palette[swatches] || palette.default.slice(0, swatches);
    let preview = (
      <PalettePreview
        colors={colors}
        size={size}
        swatches={swatches}
        borderRadius={borderRadius}
        margin={margin}
        showTooltip={showTooltip}
        backgroundColor={backgroundColor}
      ></PalettePreview>
    );

    return (
      <Grid
        key={id}
        onPointerEnter={(e) => {
          e.target.style.backgroundColor = highlightColor;
        }}
        onPointerLeave={(e) => {
          e.target.style.backgroundColor = "transparent";
        }}
        style={{
          cursor: handleClick ? "pointer" : "auto",
          width: "100%",
          height: `calc( ${size} + 2 * ${margin} )`,
          borderRadius: borderRadius ? "0.5em" : "0",
          padding: "0 0.25em",
        }}
        onClick={handleClick ? () => handleClick(id) : () => {}}
      >
        <Grid
          container
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          spacing={1}
          color={textColor}
          style={{ pointerEvents: "none" }}
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
      style={{
        width: "fit-content",
        borderRadius: borderRadius ? "0.5em" : "0",
        margin: "0.5em",
        padding: "0.5em",
        backgroundColor: backgroundColor,
        borderColor: theme === "dark" ? lightColor : darkColor,
        borderWidth: "0.1em",
        borderStyle: "solid",
      }}
    >
      {palettePreviews}
    </Grid>
  );
};

export default compose(withColors)(PalettePicker);
