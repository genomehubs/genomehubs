import {
  fetchTypes,
  getDisplayTypes,
  getGroupedTypes,
  getSynonyms,
  getTypesMap,
} from "../selectors/types";
import { getTypes, resetTypes } from "../reducers/types";

import React from "react";
import { connect } from "react-redux";

const withTypes = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    types: getTypesMap(state),
    allTypes: getTypes(state),
    synonyms: getSynonyms(state),
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
