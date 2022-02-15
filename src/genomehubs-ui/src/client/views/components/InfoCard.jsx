import React from "react";
import styles from "./Styles.scss";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Typography from "@material-ui/core/Typography";

export const images = require.context("./img", true, /\.(png|jpe?g|svg)$/);

const InfoCard = (props) => {
  let placeholder = props.image ? props.image : "placeholder.png";

  return (
    <Card className={styles.root} variant="outlined">
      <CardContent>
        <Typography className={styles.title} color="textSecondary" gutterBottom>
          {props.title}
        </Typography>
        <Typography variant="body2" component="p">
          {props.text || ""}
        </Typography>
      </CardContent>
      <CardMedia
        className={styles.cover}
        image={images(`./${placeholder}`).default}
        title={props.title}
      />
    </Card>
  );
};

export default InfoCard;
