import React from "react";
import { connect } from "react-redux";
import { getSuggestedTerms } from "#reducers/search";

const withTerms = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    suggestedTerms: getSuggestedTerms(state),
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withTerms;
