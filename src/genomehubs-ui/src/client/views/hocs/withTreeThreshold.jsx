import React from "react";
import { connect } from "react-redux";
import { treeThreshold } from "../reducers/tree";

const withTreeThreshold = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    treeThreshold: treeThreshold,
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withTreeThreshold;
