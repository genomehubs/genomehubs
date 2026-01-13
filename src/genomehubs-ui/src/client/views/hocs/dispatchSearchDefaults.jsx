import { resetSearchDefaults, setSearchDefaults } from "#reducers/search";

import React from "react";
import { connect } from "react-redux";

const dispatchSearchDefaults = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});

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

export default dispatchSearchDefaults;
