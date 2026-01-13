import React from "react";
import { connect } from "react-redux";
import { setMessage } from "#reducers/message";

const dispatchMessage = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});

  const mapDispatchToProps = (dispatch) => ({
    setMessage: (message) => {
      dispatch(setMessage(message));
    },
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default dispatchMessage;
