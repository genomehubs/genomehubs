import {
  fetchMsearchResults,
  fetchSearchResults,
  saveSearchResults,
} from "#selectors/search";
import {
  getPreferSearchTerm,
  getPreviousSearchTerm,
  getSearchIndex,
  getSearchResultArray,
  getSearchResultById,
  getSearchResults,
  getSearchTerm,
  resetSearch,
  setPreferSearchTerm,
  setPreviousSearchTerm,
  setSearchIndex,
  setSearchTerm,
} from "#reducers/search";

import { connect } from "react-redux";

const withSearch = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    searchTerm: getSearchTerm(state),
    searchIndex: getSearchIndex(state),
    preferSearchTerm: getPreferSearchTerm(state),
    previousSearchTerm: getPreviousSearchTerm(state),
    searchResults: getSearchResults(state),
    searchResultArray: getSearchResultArray(state),
    ...(props.recordId && {
      searchById: getSearchResultById(state, props.recordId),
    }),
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchSearchResults: (options, navigate) => {
      if (options.searches && Array.isArray(options.searches)) {
        // Multi-search batch request
        dispatch(fetchMsearchResults(options, navigate));
      } else if (options.query && options.query.length > 0) {
        dispatch(fetchSearchResults(options, navigate));
      } else {
        dispatch(resetSearch());
      }
    },
    resetSearch: () => dispatch(resetSearch()),
    setSearchTerm: (options) => dispatch(setSearchTerm(options)),
    setSearchIndex: (index) => dispatch(setSearchIndex(index)),
    setPreferSearchTerm: (bool) => dispatch(setPreferSearchTerm(bool)),
    setPreviousSearchTerm: (options) =>
      dispatch(setPreviousSearchTerm(options)),
    saveSearchResults: ({ options, format }) =>
      dispatch(saveSearchResults({ options, format })),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withSearch;
