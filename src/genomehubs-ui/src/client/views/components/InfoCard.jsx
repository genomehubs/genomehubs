import {
  cover as coverStyle,
  root as rootStyle,
  title as titleStyle,
} from "./Styles.scss";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import React from "react";
import Typography from "@mui/material/Typography";

export const images = require.context("./img", true, /\.(png|jpe?g|svg)$/);

const InfoCard = (props) => {
  let placeholder = props.image || "placeholder.png";

  return (
    <Card className={rootStyle} variant="outlined">
      <CardContent>
        <Typography className={titleStyle} color="textSecondary" gutterBottom>
          {props.title}
        </Typography>
        <Typography variant="body2" component="p">
          {props.text || ""}
        </Typography>
      </CardContent>
      <CardMedia
        className={coverStyle}
        image={images(`./${placeholder}`).default}
        title={props.title}
      />
    </Card>
  );
};

export default InfoCard;
