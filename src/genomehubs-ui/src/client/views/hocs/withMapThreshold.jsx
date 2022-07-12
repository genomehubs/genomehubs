import React from "react";
import { connect } from "react-redux";
import { mapThreshold } from "../reducers/map";

const withMapThreshold = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    mapThreshold: mapThreshold,
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withMapThreshold;
