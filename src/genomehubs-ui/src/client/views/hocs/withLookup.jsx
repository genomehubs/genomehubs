import {
  fetchLookup,
  getLookupTerm,
  getLookupTerms,
  resetLookup,
  setLookupTerm,
} from "../reducers/lookup";

import React from "react";
import { connect } from "react-redux";

const withLookup = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    lookupTerm: getLookupTerm(state),
    lookupTerms: getLookupTerms(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchLookup: ({ lookupTerm, result, taxonomy }) => {
      if (lookupTerm.length > 3) {
        dispatch(fetchLookup({ lookupTerm, result, taxonomy }));
      } else {
        dispatch(resetLookup());
      }
    },
    setLookupTerm: (lookupTerm) =>
      dispatch(setLookupTerm(decodeURIComponent(lookupTerm))),
    resetLookup: () => dispatch(resetLookup()),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withLookup;
