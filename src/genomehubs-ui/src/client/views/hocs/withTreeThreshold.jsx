import React from "react";
import { connect } from "react-redux";
import { getTreeThreshold } from "../reducers/tree";

const withTreeThreshold = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    treeThreshold: getTreeThreshold(state),
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withTreeThreshold;
