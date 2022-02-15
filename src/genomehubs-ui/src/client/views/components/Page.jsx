import Grid from "@material-ui/core/Grid";
import React from "react";
import SearchBox from "./SearchBox";
import classnames from "classnames";
import { compose } from "recompose";
import { makeStyles } from "@material-ui/core/styles";
import styles from "./Styles.scss";

const useStyles = makeStyles((theme) => ({
  container: {
    minHeight: "100%",
    minWidth: "100%",
    maxWidth: "100%",
  },
  item: { minWidth: "900px", maxWidth: "80%", align: "center" },
  itemFull: { width: "100%", align: "center" },
}));

const Page = ({
  searchBox,
  panels,
  text,
  topLevel,
  pageRef,
  recordId,
  fieldId,
  resultCount,
  result,
}) => {
  const classes = useStyles();
  const itemCss = topLevel ? classes.itemFull : classes.item;
  let items = [];
  if (panels && panels.length > 0) {
    panels.forEach((obj, i) => {
      let styles = {};
      Object.keys(obj).forEach((key) => {
        if (key != "panel") {
          styles[key] = obj[key];
        }
      });
      items.push(
        <Grid item className={itemCss} style={styles} key={i}>
          {obj.panel}
        </Grid>
      );
    });
  }
  let title;
  if (recordId && result) {
    title = `${result} record ${recordId}`;
  } else if (fieldId) {
    title = `${fieldId} summary`;
  } else if (resultCount >= 0) {
    title = `${resultCount} ${resultCount == 1 ? "hit" : "hits"}`;
  } else if (resultCount < 0) {
    title = `updating search results...`;
  }
  return (
    <Grid
      container
      spacing={2}
      direction="column"
      alignItems="center"
      justifyContent="center"
      className={classes.container}
      ref={pageRef}
    >
      {searchBox && (
        <Grid item className={itemCss} style={{ marginTop: "2em" }}>
          <SearchBox />
        </Grid>
      )}
      {title && (
        <Grid
          item
          className={classnames(styles.pageTitle, itemCss)}
          style={{ marginBottom: "0.5em" }}
        >
          {title}
        </Grid>
      )}
      {items}
      {text && (
        <Grid item className={itemCss}>
          {text}
        </Grid>
      )}
    </Grid>
  );
};

export default Page;
