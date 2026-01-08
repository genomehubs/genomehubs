import {
  overlay as overlayStyle,
  paletteContainer as paletteContainerStyle,
} from "./Styles.scss";

import Grid from "@mui/material/Grid2";
import PalettePreview from "./PalettePreview";
import React from "react";
import { compose } from "redux";
import makeStyles from "@mui/styles/makeStyles";
import withColors from "#hocs/withColors";
import withTheme from "#hocs/withTheme";

const useStyles = makeStyles((theme) => ({
  paper: {
    // minWidth: "20em",
    padding: "1em",
    overflow: "auto",
    scrollbarGutter: "stable both-edges",
    fontFamily: '"Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.default,
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
  colorScheme,
  theme = "lightTheme",
  args,
}) => {
  const classes = useStyles();

  let backgroundColor = colorScheme[theme].lightColor;

  let textColor = colorScheme[theme].darkColor;
  // let highlightColor = theme === "darkTheme" ? "#7f7f7f" : "#dfdfdf";

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
        style={{
          cursor: handleClick ? "pointer" : "auto",
          height: `calc( ${size} + 2 * ${margin} )`,
          borderRadius: borderRadius ? "0.5em" : "0",
        }}
        className={paletteContainerStyle}
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
          <Grid>{id}</Grid>
          <Grid>{preview}</Grid>
          <div
            className={overlayStyle}
            style={{
              borderRadius: borderRadius ? "0.5em" : "0",
            }}
          ></div>
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
        // padding: "0.5em",
        backgroundColor: backgroundColor,
        borderColor: textColor,
        borderWidth: "0.1em",
        borderStyle: "solid",
      }}
    >
      {palettePreviews}
    </Grid>
  );
};

export default compose(withTheme, withColors)(PalettePicker);
