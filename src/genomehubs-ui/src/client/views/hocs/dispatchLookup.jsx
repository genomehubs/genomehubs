import { fetchAutocomplete, resetAutocomplete } from "../reducers/autocomplete";

import React from "react";
import { connect } from "react-redux";
import { setLookupTerm } from "../reducers/lookup";

const dispatchLookup = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});

  const mapDispatchToProps = (dispatch) => ({
    fetchAutocomplete: ({ lookupTerm, result, taxonomy, lastType }) => {
      dispatch(fetchAutocomplete({ lookupTerm, result, taxonomy, lastType }));
    },
    setLookupTerm: (lookupTerm) =>
      dispatch(setLookupTerm(decodeURIComponent(lookupTerm))),
    resetAutocomplete: () => dispatch(resetAutocomplete()),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default dispatchLookup;
