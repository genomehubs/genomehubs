import { getController, resetController } from "../reducers/message";

import React from "react";
import { connect } from "react-redux";

const withController = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    controller: getController(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    resetController: () => resetController(),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withController;
