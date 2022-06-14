import { getSearchIndex, setSearchIndex } from "../reducers/search";

import React from "react";
import { connect } from "react-redux";

const withSearchIndex = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    searchIndex: getSearchIndex(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setSearchIndex: (index) => dispatch(setSearchIndex(index)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withSearchIndex;
