import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "@reach/router";

import ControlPointIcon from "@material-ui/icons/ControlPoint";
import DialogContent from "@material-ui/core/DialogContent";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Modal from "@material-ui/core/Modal";
import QueryBuilder from "./QueryBuilder";
import ReplayIcon from "@material-ui/icons/Replay";
import SearchSettings from "./SearchSettings";
import Switch from "@material-ui/core/Switch";
import Terms from "./Terms";
import TocIcon from "@material-ui/icons/Toc";
import Tooltip from "@material-ui/core/Tooltip";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import { makeStyles } from "@material-ui/core/styles";
import qs from "../functions/qs";
import withSearch from "../hocs/withSearch";
import withSearchDefaults from "../hocs/withSearchDefaults";
import withSiteName from "../hocs/withSiteName";

export const useStyles = makeStyles((theme) => ({
  modal: {
    display: "flex",
    padding: theme.spacing(1),
    alignItems: "center",
    justifyContent: "center",
  },
  paper: {
    width: 400,
    maxWidth: "75vw",
    maxHeight: "75vh",
    backgroundColor: theme.palette.background.paper,
    border: "2px solid #000",
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
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
    setSearchDefaults({ includeEstimates: false, includeDescendant: false });
    setLookupTerm("");
    navigate(`${basename}/search`);
  };
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
              className={classes.formControl}
              style={{ margin: "-8px 0 0", transform: "scale(0.75)" }}
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
        <Tooltip
          title={`Toggle switch to ${
            searchDefaults.includeEstimates
              ? "exclude estimated values from"
              : "include estimated values in"
          } results`}
          arrow
          placement={"top"}
        >
          <Grid item xs={3}>
            <FormControl
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
        <Grid item xs={1}></Grid>
        <Tooltip title={`Click to set result columns`} arrow placement={"top"}>
          <Grid
            item
            xs={2}
            onClick={() => setShowSettings(true)}
            style={{ cursor: "pointer" }}
          >
            <FormControl
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
            onClick={() => setShowOptions(true)}
            style={{ cursor: "pointer" }}
          >
            <FormControl
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
