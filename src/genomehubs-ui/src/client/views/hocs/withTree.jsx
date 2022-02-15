import {
  fetchNodes,
  getAPITreeNodes,
  getNewickString,
  getTreeRings,
} from "../selectors/tree";
import {
  getNodes,
  getRootNode,
  getTreeHighlight,
  getTreeQuery,
  resetNodes,
  setRootNode,
  setTreeHighlight,
  setTreeQuery,
} from "../reducers/tree";

import React from "react";
import { connect } from "react-redux";

const withTree = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    nodes: getNodes(state),
    treeNodes: getAPITreeNodes(state),
    treeRings: getTreeRings(state),
    rootNode: getRootNode(state),
    treeHighlight: getTreeHighlight(state),
    treeQuery: getTreeQuery(state),
    newickString: getNewickString(state),
    // ...(props.recordId && {
    //   searchById: getSearchResultById(state, props.recordId),
    // }),
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchNodes: (options) => {
      if (options.query && options.query.length > 0) {
        dispatch(fetchNodes(options));
      } else {
        dispatch(resetNodes());
      }
    },
    setRootNode: (id) => dispatch(setRootNode(id)),
    setTreeHighlight: (obj) => dispatch(setTreeHighlight(obj)),
    setTreeQuery: (obj) => dispatch(setTreeQuery(obj)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withTree;
