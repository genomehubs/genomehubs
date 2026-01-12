import { createAction, handleAction, handleActions } from "redux-actions";

import { produce } from "immer";

export const requestNodes = createAction("REQUEST_NODES");
export const receiveNodes = createAction("RECEIVE_NODES");
export const cancelNodesRequest = createAction("CANCEL_NODES_REQUEST");
export const resetNodes = createAction("RESET_NODES");

export const treeThreshold = TREE_THRESHOLD;

export const setTreeThreshold = createAction("SET_TREE_THRESHOLD");
export const treeThresholdValue = handleAction(
  "SET_TREE_THRESHOLD",
  (state, action) => action.payload,
  treeThreshold
);
export const getTreeThreshold = (state) => state.treeThresholdValue;

const defaultState = () => ({
  isFetching: false,
  treeNodes: {},
});

const nodes = handleActions(
  {
    REQUEST_NODES: (state, action) =>
      produce(state, (draft) => {
        draft.isFetching = true;
      }),
    CANCEL_NODES_REQUEST: (state, action) =>
      produce(state, (draft) => {
        draft.isFetching = false;
      }),
    RECEIVE_NODES: (state, action) => {
      let tree = {};
      tree = action.payload.report.report.tree.tree;
      return {
        isFetching: false,
        status: action.payload.status,
        ...tree,
      };
    },
    RESET_NODES: defaultState,
  },
  defaultState()
);

export const getNodes = (state) => state.nodes;

export const setRootNode = createAction("SET_ROOT_NODE");
export const rootNode = handleAction(
  "SET_ROOT_NODE",
  (state, action) => action.payload,
  null
);
export const getRootNode = (state) => state.rootNode;

const treeHighlightDefault = {
  field: "assembly_span",
  condition: undefined,
  value: undefined,
};
export const setTreeHighlight = createAction("SET_TREE_HIGHLIGHT");
export const treeHighlight = handleAction(
  "SET_TREE_HIGHLIGHT",
  (state, action) =>
    action.payload.field ? action.payload : treeHighlightDefault,
  treeHighlightDefault
);
export const getTreeHighlight = (state) => state.treeHighlight;

export const setTreeQuery = createAction("SET_TREE_QUERY");
export const treeQuery = handleAction(
  "SET_TREE_QUERY",
  (state, action) => action.payload,
  null
);
export const getTreeQuery = (state) => state.treeQuery;

export const treeReducers = {
  nodes,
  rootNode,
  treeHighlight,
  treeQuery,
  treeThresholdValue,
};
