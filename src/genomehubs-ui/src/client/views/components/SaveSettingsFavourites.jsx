import React, { useState } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";

import Button from "@material-ui/core/Button";
import EditIcon from "@material-ui/icons/Edit";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import MuiDialogContent from "@material-ui/core/DialogContent";
import SearchIcon from "@material-ui/icons/Search";
import Typography from "@material-ui/core/Typography";
import YamlEditor from "@focus-reactive/react-yaml";
import { compose } from "recompose";
import { favouriteButton } from "./SearchHeaderButtons";
import { format } from "d3-format";
import qs from "../functions/qs";
import { searchTerm } from "../reducers/search";
import styles from "./Styles.scss";
import { useLocalStorage } from "usehooks-ts";
import { useNavigate } from "@reach/router";

// import withSearchIndex from "../hocs/withSearchIndex";

const reportParams = {
  report: false,
  y: false,
  z: false,
  cat: false,
  pointSize: 15,
  rank: false,
  stacked: false,
  yScale: "linear",
  cumulative: false,
  compactLegend: false,
  catToX: false,
};

const searchParams = {
  query: false,
  result: false,
  includeEstimates: "false",
  summaryValues: "count",
  taxonomy: "ncbi",
  size: 10,
  offset: 0,
  fields: "",
  names: "",
  ranks: "",
};

const splitTerms = (terms) => {
  let searchTerm = {};
  let reportTerm = {};
  for (let key in terms) {
    if (reportParams[key] !== undefined) {
      if (reportParams[key] === false) {
        reportTerm[key] = terms[key];
      } else if (reportParams[key] != terms[key]) {
        reportTerm[key] = terms[key];
      }
    } else if (searchParams.hasOwnProperty(key)) {
      if (searchParams[key] != terms[key]) {
        searchTerm[key] = terms[key];
      }
    } else {
      searchTerm[key] = terms[key];
    }
  }
  return { searchTerm, reportTerm: reportTerm.report ? reportTerm : undefined };
};

export const useStyles = makeStyles((theme) => ({
  paper: {
    // width: "96%",
    // minWidth: "600px",
    // padding: theme.spacing(2),
    // marginTop: theme.spacing(2),

    boxShadow: "none",
  },
  formControl: {
    margin: theme.spacing(2),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  label: {
    color: "rgba(0, 0, 0, 0.54)",
  },
}));

const SaveSettingsFavourites = ({ rootRef, currentIndex, handleClose }) => {
  const navigate = useNavigate();
  const [expand, setExpand] = useState({});
  const [remove, setRemove] = useState({});
  const [edit, setEdit] = useState({});
  // const [changed, setChanged] = useState({});
  let changed = {};
  const [favourites, setFavourites] = useLocalStorage(
    `${currentIndex}Favourites`,
    {}
  );
  const [currentFavourites, setCurrentFavourites] = useState(favourites);

  const DialogContent = withStyles((theme) => ({
    root: {
      padding: theme.spacing(2),
    },
  }))(MuiDialogContent);

  let favListings = [];

  const handleChange = ({ json, key }) => {
    changed[key] = json;
  };

  const handleSave = () => {
    let newFavourites = { ...currentFavourites };
    Object.keys(changed).forEach((key) => {
      newFavourites[JSON.stringify(changed[key])] = true;
      delete newFavourites[key];
    });
    for (let key in remove) {
      delete newFavourites[key];
    }
    setFavourites(newFavourites);
  };

  const toggleEdit = (key) => {
    if (edit[key] && changed[key]) {
      let newFavourites = { ...currentFavourites };
      delete newFavourites[key];
      newFavourites[JSON.stringify(changed[key])] = true;
      setCurrentFavourites(newFavourites);
      delete changed[key];
    }
    setEdit({ ...edit, [key]: !edit[key] });
  };

  const handleExpand = (key) => {
    setExpand({ ...expand, [key]: !expand[key] });
  };

  const formatYaml = ({ searchTerm, reportTerm }) => {
    let arr = Object.entries(searchTerm || {}).map(([key, value]) => (
      <pre key={key} className={styles.favListing}>
        <b>{key}:</b> {JSON.stringify(value)}
      </pre>
    ));
    if (reportTerm && Object.keys(reportTerm).length > 0) {
      arr.push(<hr key={"hr"} />);
      arr = arr.concat(
        Object.entries(reportTerm || {}).map(([key, value]) => (
          <pre key={key} className={styles.favListing}>
            <b>{key}:</b> {JSON.stringify(value)}
          </pre>
        ))
      );
    }
    return arr;
  };

  Object.keys(currentFavourites).forEach((key, i) => {
    // let searchTerm = JSON.parse(key);
    let { searchTerm, reportTerm } = splitTerms(JSON.parse(key));
    let favButton = favouriteButton(!remove[key], () => {
      setRemove({ ...remove, [key]: !remove[key] });
    });

    favListings.push(
      <div key={i} className={styles.favListing}>
        <div className={styles.favListingContainer}>
          <div className={styles.favListingHeader}>
            {favButton}
            <span
              className={styles.favListingExpand}
              onClick={() => handleExpand(key)}
            >
              {expand[key] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </span>
            <Typography>
              <span
                style={{
                  marginRight: "1.5em",
                }}
              >
                {searchTerm.name || searchTerm.query}
              </span>
            </Typography>
          </div>
          {expand[key] && (
            <div className={styles.favListingContent}>
              {edit[key] ? (
                <YamlEditor
                  json={{
                    name: searchTerm.name || searchTerm.query,
                    ...searchTerm,
                    ...reportTerm,
                  }}
                  onChange={({ json }) => handleChange({ json, key })}
                />
              ) : (
                formatYaml({ searchTerm, reportTerm })
              )}
              <div className={styles.favListingButton}>
                <Button
                  autoFocus
                  color="primary"
                  // variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => toggleEdit(key)}
                >
                  Edit
                </Button>
                <Button
                  autoFocus
                  color="primary"
                  // variant="outlined"
                  startIcon={<SearchIcon />}
                  onClick={() =>
                    navigate(`/search?${qs.stringify(JSON.parse(key))}`)
                  }
                >
                  Search
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  });
  if (favListings.length === 0) {
    favListings = (
      <Typography key="no-favourites">
        You do not have any favourite searches for the {currentIndex} index.
        <br />
        To add a favourite, click the heart icon above the search results table.
      </Typography>
    );
  } else if (
    Object.keys(remove).filter((_, v) => v).length > 0 ||
    Object.keys(changed).length > 0 ||
    JSON.stringify(favourites) != JSON.stringify(currentFavourites)
  ) {
    favListings.push(
      <div
        key={"save-changes"}
        style={{ position: "relative", height: "2em", width: "100%" }}
      >
        <Button
          className={styles.favListingButton}
          autoFocus
          onClick={handleSave}
          color="primary"
        >
          Save changes
        </Button>
      </div>
    );
  }

  return <DialogContent dividers>{favListings}</DialogContent>;
};

export default SaveSettingsFavourites;
