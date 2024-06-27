import React, { useState } from "react";
import { makeStyles, withStyles } from "@material-ui/core/styles";

import Button from "@material-ui/core/Button";
import EditIcon from "@material-ui/icons/Edit";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import MuiDialogContent from "@material-ui/core/DialogContent";
import SearchIcon from "@material-ui/icons/Search";
import Typography from "@material-ui/core/Typography";
import YAML from "yaml";
import { compose } from "recompose";
import { favouriteButton } from "./SearchHeaderButtons";
import qs from "../functions/qs";
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
  const [favourites, setFavourites] = useLocalStorage(
    `${currentIndex}Favourites`,
    {}
  );

  const DialogContent = withStyles((theme) => ({
    root: {
      padding: theme.spacing(2),
    },
  }))(MuiDialogContent);

  let favListings = [];

  const handleExpand = (key) => {
    setExpand({ ...expand, [key]: !expand[key] });
  };

  Object.keys(favourites).forEach((key, i) => {
    // let searchTerm = JSON.parse(key);
    let { searchTerm, reportTerm } = splitTerms(JSON.parse(key));
    const searchTermsDoc = new YAML.Document();
    searchTermsDoc.contents = searchTerm;
    const reportTermsDoc = new YAML.Document();
    reportTermsDoc.contents = reportTerm;
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
                {searchTerm.query}
              </span>
            </Typography>
          </div>
          {expand[key] && (
            <div className={styles.favListingContent}>
              <pre>{searchTermsDoc.toString()}</pre>
              {reportTermsDoc
                .toString()
                .split("\n")
                .map((line, i) => (
                  <pre className={styles.favListingExtra}>{line}</pre>
                ))}
              <div className={styles.favListingButton}>
                <Button
                  autoFocus
                  color="primary"
                  // variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() =>
                    navigate(`/search?${qs.stringify(JSON.parse(key))}`)
                  }
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

  return <DialogContent dividers>{favListings}</DialogContent>;
};

export default SaveSettingsFavourites;
