import React, { memo, useRef, useState } from "react";

import Autocomplete from "@material-ui/lab/Autocomplete";
import Grid from "@material-ui/core/Grid";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import Popper from "@material-ui/core/Popper";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import { compose } from "recompose";
import { getSuggestedTerm } from "../reducers/search";
import { makeStyles } from "@material-ui/core/styles";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import withLookup from "../hocs/withLookup";
import withSearch from "../hocs/withSearch";
import withSearchDefaults from "../hocs/withSearchDefaults";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

const useStyles = makeStyles((theme) => ({
  icon: {
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(2),
  },
  formControl: {
    marginTop: theme.spacing(2),
    minWidth: "600px",
  },
  search: {
    fontSize: "2em",
    marginLeft: theme.spacing(1),
    backgroundColor: "inherit",
  },
}));

const PlacedPopper = (props) => {
  return <Popper {...props} placement="bottom" />;
};

const AutoCompleteSuggestion = ({ option }) => {
  const classes = useStyles();
  return (
    <Grid container alignItems="center">
      <Grid item>
        <HelpOutlineIcon className={classes.icon} />
      </Grid>
      <Grid item xs>
        <Typography variant="body2" color="textSecondary">
          Did you mean
        </Typography>
        <div>{option.title}</div>
      </Grid>
    </Grid>
  );
};

const AutoCompleteOption = ({ option }) => {
  const classes = useStyles();
  let primaryText, secondaryText;
  if (option.name_class) {
    primaryText = (
      <>
        {option.xref && (
          <div style={{ display: "inline-block" }}>
            <Typography variant="body2" color="textSecondary">
              {`${option.name_class}:`}
            </Typography>
          </div>
        )}
        {option.xref && " "}
        {option.title}
      </>
    );
    secondaryText = (
      <Typography variant="body2" color="textSecondary">
        {option.taxon_rank}
        {option.name_class != "scientific name" &&
          option.name_class != "taxon ID" && (
            <span>: {option.scientific_name}</span>
          )}
      </Typography>
    );
  } else if (option.identifier_class) {
    if (option.result == "assembly") {
      secondaryText = (
        <Typography variant="body2" color="textSecondary">
          {option.scientific_name}
        </Typography>
      );
    } else {
      secondaryText = (
        <Typography variant="body2" color="textSecondary">
          {option.feature_id}
        </Typography>
      );
    }
  }

  return (
    <Grid container alignItems="center">
      <Grid item>
        <SearchIcon className={classes.icon} />
      </Grid>
      <Grid item xs>
        <div>{primaryText}</div>
        <span style={{ float: "right" }}>
          <Typography variant="body2" color="textSecondary">
            {(option.name_class && option.taxon_id) || option.assembly_id}
          </Typography>
        </span>
        {secondaryText}
      </Grid>
    </Grid>
  );
};

const siteName = SITENAME || "GenomeHub";

const suggestedTerm = getSuggestedTerm();

const SearchAutocomplete = ({
  lookupTerm,
  setLookupTerm,
  resetLookup,
  lookupTerms,
  fetchLookup,
  taxonomy,
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const searchBoxRef = useRef(null);
  const searchInputRef = useRef(null);
  let [open, setOpen] = useState(false);
  const updateTerm = (value) => {
    setLookupTerm(value);
    fetchLookup({ lookupTerm: value, taxonomy });
  };
  const handleChange = (e, newValue) => {
    if (newValue != lookupTerm) {
      if (!newValue.match(/[\r\n]/)) {
        setMultiline(false);
        updateTerm(newValue);
        setOpen(true);
      } else if (!multiline) {
        updateTerm(newValue);
        setOpen(true);
      }
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        e.preventDefault();
        setMultiline(true);
        setLookupTerm(`${searchInputRef.current.value}\n`);
      } else if (!multiline) {
        handleSubmit(e);
      }
    }
  };
  const handleKeyDown = (e, newValue) => {
    if (e.shiftKey) {
      handleKeyPress(e);
    } else if (newValue) {
      if (newValue.highlighted) {
        setOpen(true);
      } else {
        setOpen(false);
        setResult(newValue.result);
        doSearch(
          newValue.unique_term || e.target.value,
          newValue.result || "taxon",
          newValue.title || e.target.value
        );
      }
    } else {
      resetLookup();
      setMultiline(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let term = searchInputRef.current.value;
    doSearch(term, result, term);
  };

  let terms;
  let options = [];
  if (
    lookupTerms.status &&
    lookupTerms.status.success &&
    lookupTerms.results &&
    lookupTerms.results.length > 0 &&
    !/[\(\)<>=]/.test(lookupTerm)
  ) {
    terms = [];
    lookupTerms.results.forEach((result, i) => {
      let value;
      if (lookupTerms.status.result == "taxon") {
        if (result.reason) {
          value = result.reason[0].fields["taxon_names.name.raw"][0];
        } else {
          value = result.result.scientific_name;
        }
        options.push({
          title: value,
          result: "taxon",
          unique_term: result.result.taxon_id,
          taxon_id: result.result.taxon_id,
          taxon_rank: result.result.taxon_rank,
          scientific_name: result.result.scientific_name,
          name_class: result.reason
            ? result.reason[0].fields["taxon_names.class"]
            : "taxon ID",
          xref: Boolean(
            result.reason &&
              result.reason[0].fields["taxon_names.class"] &&
              !result.reason[0].fields["taxon_names.class"][0].match(" name")
          ),
        });
        terms.push(
          <div key={i} className={styles.term}>
            <span className={styles.value}>{value}</span>
            <div
              className={styles.extra}
            >{`\u2014 ${result.result.taxon_rank}`}</div>
          </div>
        );
      } else if (lookupTerms.status.result == "assembly") {
        if (result.reason) {
          value = result.reason[0].fields["identifiers.identifier.raw"][0];
        } else {
          value = result.result.assembly_id;
        }
        options.push({
          title: value,
          result: "assembly",
          unique_term: result.result.assembly_id,
          taxon_id: result.result.taxon_id,
          scientific_name: result.result.scientific_name,
          assembly_id: result.result.assembly_id,
          identifier_class: result.reason
            ? result.reason[0].fields["identifiers.class"]
            : "assembly ID",
        });
        terms.push(
          <div key={i} className={styles.term}>
            <span className={styles.value}>{value}</span>
            <div
              className={styles.extra}
            >{`\u2014 ${result.result.scientific_name}`}</div>
          </div>
        );
      } else if (lookupTerms.status.result == "feature") {
        if (result.reason) {
          value = result.reason[0].fields["identifiers.identifier.raw"][0];
        } else {
          value = result.result.feature_id;
        }
        options.push({
          title: value,
          result: "feature",
          unique_term: result.result.feature_id,
          taxon_id: result.result.taxon_id,
          assembly_id: result.result.assembly_id,
          feature_id: result.result.feature_id,
          identifier_class: result.reason
            ? result.reason[0].fields["identifiers.class"]
            : "feature ID",
        });
        terms.push(
          <div key={i} className={styles.term}>
            <span className={styles.value}>{value}</span>
            <div
              className={styles.extra}
            >{`\u2014 ${result.result.primary_type}`}</div>
          </div>
        );
      }
    });
  }
  if (
    lookupTerms.status &&
    lookupTerms.status.success &&
    lookupTerms.suggestions &&
    lookupTerms.suggestions.length > 0 &&
    !/[\(\)<>=]/.test(lookupTerm)
  ) {
    lookupTerms.suggestions.forEach((suggestion, i) => {
      options.push({
        title: suggestion.suggestion.text,
        highlighted: suggestion.suggestion.highlighted,
      });
    });
  }

  return (
    <Autocomplete
      id="main-search"
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.title
      }
      getOptionSelected={(option, value) => option.title === value.title}
      options={options}
      autoComplete
      includeInputInList
      freeSolo
      value={lookupTerm}
      open={open}
      onChange={handleKeyDown}
      onInputChange={handleChange}
      PopperComponent={PlacedPopper}
      renderInput={(params) => (
        <TextField
          onKeyPress={handleKeyPress}
          {...params}
          inputRef={searchInputRef}
          label={searchText}
          variant="outlined"
          fullWidth
          multiline
          maxRows={5}
        />
      )}
      renderOption={(option) => {
        if (option.highlighted) {
          return <AutoCompleteSuggestion option={option} />;
        }
        return <AutoCompleteOption option={option} />;
      }}
    />
  );
};

export default compose(
  memo,
  withTaxonomy,
  withTypes,
  withSearch,
  withSearchDefaults,
  withLookup
)(SearchAutocomplete);
