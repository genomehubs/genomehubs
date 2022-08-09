import { getLiveQuery, setLiveQuery } from "../reducers/lookup";

import React from "react";
import { connect } from "react-redux";

const withLiveQuery = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    liveQuery: getLiveQuery(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setLiveQuery: (queryTerm) => dispatch(setLiveQuery(queryTerm)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withLiveQuery;
