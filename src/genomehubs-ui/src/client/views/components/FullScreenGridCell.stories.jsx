import { Box, Typography } from "@mui/material";

import FullScreenGridCell from "./FullScreenGridCell";
import Grid from "@mui/material/Grid2";
import React from "react";

export default {
  title: "Components/FullScreenGridCell",
  component: FullScreenGridCell,
};

const PlaceholderContent = ({ text }) => (
  <Box
    sx={{
      height: "100%",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "lightgray",
      border: "1px solid #ccc",
    }}
  >
    <Typography variant="body1">{text}</Typography>
  </Box>
);

export const HorizontalGrid = () => (
  <Grid container spacing={2}>
    <Grid size={4}>
      <FullScreenGridCell>
        <PlaceholderContent text="First Cell" />
      </FullScreenGridCell>
    </Grid>
    <Grid size={4}>
      <FullScreenGridCell>
        <PlaceholderContent text="Second Cell" />
      </FullScreenGridCell>
    </Grid>
    <Grid size={4}>
      <FullScreenGridCell>
        <PlaceholderContent text="Last Cell" />
      </FullScreenGridCell>
    </Grid>
  </Grid>
);

export const VerticalGrid = () => (
  <Grid container spacing={2} direction="column">
    <Grid size={4}>
      <FullScreenGridCell>
        <PlaceholderContent text="First Cell" />
      </FullScreenGridCell>
    </Grid>
    <Grid size={4}>
      <FullScreenGridCell>
        <PlaceholderContent text="Second Cell" />
      </FullScreenGridCell>
    </Grid>
    <Grid size={4}>
      <FullScreenGridCell>
        <PlaceholderContent text="Last Cell" />
      </FullScreenGridCell>
    </Grid>
  </Grid>
);
