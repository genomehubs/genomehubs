import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import ArtTrackIcon from "@mui/icons-material/ArtTrack";
import ControlPointIcon from "@mui/icons-material/ControlPoint";
import DialogContent from "@mui/material/DialogContent";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import QueryBuilder from "./QueryBuilder";
import ReplayIcon from "@mui/icons-material/Replay";
import SearchSettings from "./SearchSettings";
import Switch from "@mui/material/Switch";
import Terms from "./Terms";
import TocIcon from "@mui/icons-material/Toc";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import makeStyles from "@mui/styles/makeStyles";
import qs from "../functions/qs";
import withSearch from "../hocs/withSearch";
import withSearchDefaults from "../hocs/withSearchDefaults";
import withSiteName from "../hocs/withSiteName";

export const useStyles = makeStyles((theme) => ({
  modal: {
    display: "flex",
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  paper: {
    width: 400,
    maxWidth: "75vw",
    maxHeight: "75vh",
    backgroundColor: "white",
    border: "2px solid #000",
    boxShadow: "#333333", // theme.shadows[5],
    padding: "16px 32px 24px",
    overflowX: "hidden",
  },
  label: {
    color: "rgba(0, 0, 0, 0.54)",
  },
}));

// const handleValueChange =

const SearchToggles = ({
  searchDefaults,
  setSearchDefaults,
  setLookupTerm,
  basename,
  toggleTemplate,
  searchIndex,
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [showOptions, setShowOptions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const rootRef = useRef(null);
  let options = qs.parse(location.search.replace(/^\?/, ""));
  const resetSearch = () => {
    setSearchDefaults({
      includeEstimates: false,
      includeDescendant: false,
      emptyColumns: false,
    });
    setLookupTerm("");
    navigate(`${basename}/search`);
  };
  let templateButton;
  if (toggleTemplate) {
    templateButton = (
      <Tooltip title={`Click to show search template`} arrow placement={"top"}>
        <Grid
          item
          xs={1}
          onClick={() => setShowSettings(true)}
          style={{ cursor: "pointer" }}
        >
          <FormControl
            variant="standard"
            className={classes.formControl}
            style={{ margin: "-8px 0 0", transform: "scale(0.75)" }}
            onClick={toggleTemplate}
          >
            <FormHelperText>template</FormHelperText>
            <IconButton aria-label="show search template" size="small">
              <ArtTrackIcon />
            </IconButton>
          </FormControl>
        </Grid>
      </Tooltip>
    );
  } else {
    templateButton = (
      <Tooltip
        title={`Toggle switch to ${
          searchDefaults.emptyColumns ? "hide" : "show"
        } empty columns`}
        arrow
        placement={"top"}
      >
        <Grid item xs={2}>
          <FormControl
            variant="standard"
            className={classes.formControl}
            style={{ margin: "-8px 0 0", transform: "scale(0.75)" }}
          >
            <FormHelperText>{"empty columns"}</FormHelperText>
            <FormControlLabel
              className={classes.label}
              control={
                <Switch
                  id={"show-empty-columns"}
                  checked={searchDefaults.emptyColumns}
                  onChange={() => {
                    let emptyColumns = !searchDefaults.emptyColumns;
                    setSearchDefaults({
                      emptyColumns,
                    });
                    let query = options.query || "";
                    let hash = location.hash || "";
                    if (emptyColumns) {
                      options.emptyColumns = true;
                    } else if (options.hasOwnProperty("emptyColumns")) {
                      options.emptyColumns = false;
                    }
                    navigate(
                      `${location.pathname}?${qs.stringify({
                        ...options,
                        query,
                      })}${hash}`
                    );
                  }}
                  name="filter-type"
                  color="default"
                />
              }
              label={searchDefaults.emptyColumns ? "On" : "Off"}
            />
          </FormControl>
        </Grid>
      </Tooltip>
    );
  }
  return (
    <>
      <Grid container direction="row" ref={rootRef}>
        <Tooltip
          title={`Toggle switch to ${
            searchDefaults.includeDescendants
              ? "exclude descendant taxa from"
              : "include descendant taxa in"
          } results`}
          arrow
          placement={"top"}
        >
          <Grid item xs={3}>
            <FormControl
              variant="standard"
              className={classes.formControl}
              style={{
                margin: "-8px 0 0",
                transform: "scale(0.75)",
                textAlign: "center",
              }}
            >
              <FormHelperText>{"include descendants"}</FormHelperText>
              <FormControlLabel
                className={classes.label}
                control={
                  <Switch
                    id={"taxon-filter-filter"}
                    checked={searchDefaults.includeDescendants}
                    onChange={() => {
                      let includeDescendants =
                        !searchDefaults.includeDescendants;
                      setSearchDefaults({
                        includeDescendants,
                      });
                      let query = options.query || "";
                      let hash = location.hash || "";
                      if (includeDescendants) {
                        query = query.replaceAll(
                          /tax_(:?eq|name)/gi,
                          "tax_tree"
                        );
                        hash = hash.replaceAll(/tax_(:?eq|name)/gi, "tax_tree");
                      } else {
                        query = query.replaceAll(/tax_tree/gi, "tax_name");
                        hash = hash.replaceAll(/tax_tree/gi, "tax_name");
                      }
                      navigate(
                        `${location.pathname}?${qs.stringify({
                          ...options,
                          query,
                        })}${hash}`
                      );
                    }}
                    name="filter-type"
                    color="default"
                  />
                }
                label={searchDefaults.includeDescendants ? "On" : "Off"}
              />
            </FormControl>
          </Grid>
        </Tooltip>
        {searchIndex == "taxon" && (
          <Tooltip
            title={`Toggle switch to ${
              searchDefaults.includeEstimates
                ? "exclude estimated values from"
                : "include estimated values in"
            } results`}
            arrow
            placement={"top"}
          >
            <Grid item xs={2}>
              <FormControl
                variant="standard"
                className={classes.formControl}
                style={{ margin: "-8px 0 0", transform: "scale(0.75)" }}
              >
                <FormHelperText>{"include estimates"}</FormHelperText>
                <FormControlLabel
                  className={classes.label}
                  control={
                    <Switch
                      id={"estimated-values-filter"}
                      checked={searchDefaults.includeEstimates}
                      onChange={() => {
                        let includeEstimates = !searchDefaults.includeEstimates;
                        setSearchDefaults({
                          includeEstimates,
                        });
                        navigate(
                          `${location.pathname}?${qs.stringify({
                            ...options,
                            includeEstimates,
                          })}${location.hash}`
                        );
                      }}
                      name="include-estimates"
                      color="default"
                    />
                  }
                  label={searchDefaults.includeEstimates ? "On" : "Off"}
                />
              </FormControl>
            </Grid>
          </Tooltip>
        )}
        {templateButton}
        {searchIndex != "taxon" && <Grid item xs={2} />}
        <Tooltip title={`Click to set result columns`} arrow placement={"top"}>
          <Grid
            item
            xs={2}
            onClick={(e) => {
              let target = e.currentTarget;
              setTimeout(() => {
                target.dispatchEvent(
                  new MouseEvent("mouseout", {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                  })
                );
              }, 20);
              setShowSettings(true);
            }}
            style={{ cursor: "pointer" }}
          >
            <FormControl
              variant="standard"
              className={classes.formControl}
              style={{ margin: "-8px 0 0", transform: "scale(0.75)" }}
            >
              <FormHelperText>result columns</FormHelperText>
              <IconButton aria-label="result settings" size="small">
                <TocIcon />
              </IconButton>
            </FormControl>
            <Modal
              open={showSettings}
              onClose={(event, reason) => {
                event.preventDefault();
                event.stopPropagation();
                setShowSettings(false);
              }}
              onMouseOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              aria-labelledby="result-settings-modal-title"
              aria-describedby="result-settings-modal-description"
              className={classes.modal}
              container={() => rootRef.current}
            >
              <DialogContent className={classes.paper}>
                <SearchSettings />
              </DialogContent>
            </Modal>
          </Grid>
        </Tooltip>
        <Tooltip title={`Click to show query builder`} arrow placement={"top"}>
          <Grid
            item
            xs={2}
            onClick={(e) => {
              let target = e.currentTarget;
              setTimeout(() => {
                target.dispatchEvent(
                  new MouseEvent("mouseout", {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                  })
                );
              }, 20);
              setShowOptions(true);
            }}
            style={{ cursor: "pointer" }}
          >
            <FormControl
              variant="standard"
              className={classes.formControl}
              style={{ margin: "-8px 0 0", transform: "scale(0.75)" }}
            >
              <FormHelperText>query builder</FormHelperText>
              <IconButton
                aria-label="query builder"
                size="small"
                onClick={() => {}}
              >
                <ControlPointIcon />
              </IconButton>
            </FormControl>
            <Modal
              open={showOptions}
              onClose={(event, reason) => {
                event.preventDefault();
                event.stopPropagation();
                setShowOptions(false);
              }}
              onMouseOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              aria-labelledby="search-options-modal-title"
              aria-describedby="search-options-modal-description"
              className={classes.modal}
              container={() => rootRef.current}
            >
              <DialogContent className={classes.paper}>
                <QueryBuilder />
              </DialogContent>
            </Modal>
          </Grid>
        </Tooltip>
        <Tooltip
          title={`Click to reset search settings`}
          arrow
          placement={"top"}
        >
          <Grid
            item
            xs={1}
            onClick={() => resetSearch()}
            style={{ cursor: "pointer" }}
          >
            <FormControl
              variant="standard"
              className={classes.formControl}
              style={{ margin: "-8px 0 0", transform: "scale(0.75)" }}
            >
              <FormHelperText>clear all</FormHelperText>
              <IconButton aria-label="result settings" size="small">
                <ReplayIcon />
              </IconButton>
            </FormControl>
          </Grid>
        </Tooltip>
      </Grid>
      {showExamples && <Terms />}
    </>
  );
};

export default compose(
  withSiteName,
  dispatchLookup,
  withSearch,
  withSearchDefaults
)(SearchToggles);
