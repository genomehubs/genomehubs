import { getInputQueries, setInputQueries } from "#reducers/lookup";

import React from "react";
import { connect } from "react-redux";

const withLiveQuery = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    inputQueries: getInputQueries(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setInputQueries: ({ id, query }) =>
      dispatch(setInputQueries({ id, query })),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withLiveQuery;
