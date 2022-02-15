import {
  fetchTypes,
  getDisplayTypes,
  getGroupedTypes,
  getTypesMap,
} from "../selectors/types";

import React from "react";
import { connect } from "react-redux";
import { resetTypes } from "../reducers/types";

const withTypes = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    types: getTypesMap(state),
    displayTypes: getDisplayTypes(state),
    groupedTypes: getGroupedTypes(state),
  });
  const mapDispatchToProps = (dispatch) => ({
    fetchTypes: (result, taxonomy) => dispatch(fetchTypes(result, taxonomy)),
    resetTypes: () => dispatch(resetTypes()),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withTypes;
