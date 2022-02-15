import {
  getSearchDefaults,
  resetSearchDefaults,
  setSearchDefaults,
} from "../reducers/search";

import React from "react";
import { connect } from "react-redux";

const withSearchDefaults = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    searchDefaults: getSearchDefaults(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setSearchDefaults: (options) => dispatch(setSearchDefaults(options)),
    resetSearchDefaults: () => dispatch(resetSearchDefaults()),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withSearchDefaults;
