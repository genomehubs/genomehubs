import React, { memo, useRef, useState } from "react";
import { link as linkStyle, pageTitle as pageTitleStyle } from "./Styles.scss";

import Grid from "@mui/material/Grid";
import SearchBox from "./SearchBox";
import SearchHeaderButtons from "./SearchHeaderButtons";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchColors from "../hocs/dispatchColors";
import makeStyles from "@mui/styles/makeStyles";
import withApi from "../hocs/withApi";
import withSearchIndex from "../hocs/withSearchIndex";
import withSiteName from "../hocs/withSiteName";

const useStyles = makeStyles((theme) => ({
  container: {
    minHeight: "100%",
    minWidth: "100%",
    maxWidth: "100%",
    paddingBottom: "1em",
  },
  item: { minWidth: "900px", maxWidth: "80%", align: "center" },
  itemFull: { width: "100%", align: "center" },
  saveSearchOptions: {
    fontSize: "2em",
    marginLeft: 8,
    backgroundColor: "inherit",
    padding: 0,
  },
}));

const Page = ({
  searchBox,
  panels,
  searchPanels,
  browsePanels,
  preSearchPanels,
  text,
  landingPage,
  topLevel,
  pageRef,
  recordId,
  fieldId,
  resultCount,
  result,
  siteName,
}) => {
  const classes = useStyles();
  const [showExamples, setShowExamples] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const rootRef = useRef(null);
  const itemCss = topLevel ? classes.itemFull : classes.item;
  let preSearchItems = [];
  if (preSearchPanels && preSearchPanels.length > 0) {
    preSearchPanels.forEach((obj, i) => {
      let panelStyles = {};
      Object.keys(obj).forEach((key) => {
        if (key != "panel") {
          panelStyles[key] = obj[key];
        }
      });
      preSearchItems.push(
        <Grid
          item
          className={itemCss}
          style={panelStyles}
          key={`pre_${i}`}
          xs={12}
        >
          {obj.panel}
        </Grid>
      );
    });
  }

  let searchItems = [];
  if (searchPanels && searchPanels.length > 0) {
    searchPanels.forEach((obj, i) => {
      let panelStyles = {};
      Object.keys(obj).forEach((key) => {
        if (key != "panel") {
          panelStyles[key] = obj[key];
        }
      });
      searchItems.push(
        <Grid
          item
          className={itemCss}
          style={{ ...panelStyles, ...(showExamples || { display: "none" }) }}
          key={`pre_${i}`}
          xs={12}
        >
          {obj.panel}
        </Grid>
      );
    });
  }

  let browseItems = [];
  if (browsePanels && browsePanels.length > 0) {
    browsePanels.forEach((obj, i) => {
      let panelStyles = {};
      Object.keys(obj).forEach((key) => {
        if (key != "panel") {
          panelStyles[key] = obj[key];
        }
      });
      browseItems.push(
        <Grid
          item
          className={itemCss}
          style={{ ...panelStyles, ...(showBrowse || { display: "none" }) }}
          key={`pre_${i}`}
          xs={12}
        >
          {obj.panel}
        </Grid>
      );
    });
  }
  let postSearchItems = [];
  if (panels && panels.length > 0) {
    panels.forEach((obj, i) => {
      let panelStyles = {};
      Object.keys(obj).forEach((key) => {
        if (key != "panel") {
          panelStyles[key] = obj[key];
        }
      });
      postSearchItems.push(
        <Grid item className={itemCss} style={panelStyles} key={i}>
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
      {preSearchItems}
      {searchBox && (
        <>
          {landingPage && (
            <Grid
              item
              className={classes.item}
              style={{
                marginBottom: "-3.25em",
                padding: "0 0.75em",
                marginTop: "-1.5em",
                minWidth: "80%",
              }}
            >
              <h2>Search {siteName}</h2>
            </Grid>
          )}
          <Grid item xs={12} id="searchBox">
            <Grid
              container
              direction="row"
              // style={{ height: "calc( 100vh - 2em )", width: "100%" }}
              alignItems="center"
            >
              <Grid
                item
                className={itemCss}
                style={{
                  marginTop: "2em",
                }}
                xs={12}
              >
                <SearchBox />
              </Grid>
            </Grid>
          </Grid>
          {landingPage && (
            <>
              <Grid
                container
                className={classes.item}
                justifyContent="flex-end"
              >
                <Grid item>
                  <span
                    style={{
                      float: "right",
                      marginTop: "1em",
                      marginBottom: showExamples ? 0 : "0",
                      marginRight: "1em",
                    }}
                  >
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        setShowExamples(!showExamples);
                        setShowBrowse(false);
                      }}
                      className={linkStyle}
                      href=""
                    >
                      {showExamples ? "hide" : "show"} examples
                    </a>
                    <a> or </a>
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        setShowBrowse(!showBrowse);
                        setShowExamples(false);
                      }}
                      className={linkStyle}
                      href="#"
                    >
                      {showBrowse ? "hide" : "browse"} tree
                    </a>
                  </span>
                </Grid>
              </Grid>
              {searchItems}
              {browseItems}
            </>
          )}
        </>
      )}
      {title && (
        <Grid
          item
          className={classnames(pageTitleStyle, itemCss)}
          style={{ marginBottom: "0.5em", paddingLeft: "0.5em" }}
          container
          direction="row"
          ref={rootRef}
        >
          <Grid item xs={6}>
            {title}
          </Grid>

          <Grid item xs={6} style={{ textAlign: "end" }}>
            <SearchHeaderButtons rootRef={rootRef} showFavourite showName />
          </Grid>
        </Grid>
      )}
      {postSearchItems}
      {text && (
        <Grid item className={itemCss}>
          {text}
        </Grid>
      )}
    </Grid>
  );
};

export default compose(
  memo,
  dispatchColors,
  withApi,
  withSiteName,
  withSearchIndex
)(Page);
