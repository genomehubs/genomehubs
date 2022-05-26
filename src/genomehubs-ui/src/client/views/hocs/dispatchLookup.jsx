import { fetchLookup, resetLookup, setLookupTerm } from "../reducers/lookup";

import React from "react";
import { connect } from "react-redux";

const dispatchLookup = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});

  const mapDispatchToProps = (dispatch) => ({
    fetchLookup: ({ lookupTerm, result, taxonomy, lastType }) => {
      dispatch(fetchLookup({ lookupTerm, result, taxonomy, lastType }));
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

export default dispatchLookup;
