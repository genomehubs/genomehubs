import {
  fetchAutocomplete,
  getAutocompleteTerms,
  resetAutocomplete,
} from "../reducers/autocomplete";

import React from "react";
import { connect } from "react-redux";

const withAutocomplete = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    autocompleteTerms: getAutocompleteTerms(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchAutocomplete: ({ lookupTerm, result, taxonomy, lastType }) => {
      dispatch(fetchAutocomplete({ lookupTerm, result, taxonomy, lastType }));
    },
    resetAutocomplete: () => dispatch(resetAutocomplete()),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withAutocomplete;
