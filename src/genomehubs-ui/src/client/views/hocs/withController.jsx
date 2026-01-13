import React from "react";
import { connect } from "react-redux";
import { resetController } from "#reducers/message";

window.controller = new AbortController();

const withController = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    controller: window.controller,
  });

  const mapDispatchToProps = (dispatch) => ({
    resetController,
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withController;
