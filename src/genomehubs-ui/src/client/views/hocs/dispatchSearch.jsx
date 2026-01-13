import { fetchSearchResults, saveSearchResults } from "#selectors/search";
import {
  resetSearch,
  resetSearchDefaults,
  setPreferSearchTerm,
  setPreviousSearchTerm,
  setSearchDefaults,
  setSearchIndex,
  setSearchTerm,
} from "#reducers/search";

import React from "react";
import { connect } from "react-redux";

const dispatchSearch = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});

  const mapDispatchToProps = (dispatch) => ({
    fetchSearchResults: (options, navigate) => {
      if (options.query && options.query.length > 0) {
        dispatch(fetchSearchResults(options, navigate));
      } else {
        dispatch(resetSearch());
      }
    },
    setSearchTerm: (options) => dispatch(setSearchTerm(options)),
    setSearchIndex: (index) => dispatch(setSearchIndex(index)),
    setPreferSearchTerm: (bool) => dispatch(setPreferSearchTerm(bool)),
    setPreviousSearchTerm: (options) =>
      dispatch(setPreviousSearchTerm(options)),
    saveSearchResults: ({ options, format }) =>
      dispatch(saveSearchResults({ options, format })),
    setSearchDefaults: (options) => dispatch(setSearchDefaults(options)),
    resetSearchDefaults: () => dispatch(resetSearchDefaults()),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default dispatchSearch;
