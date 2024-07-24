import {
  getApiAttempt,
  getApiStatus,
  getApiUrl,
  setApiAttempt,
  setApiStatus,
} from "../reducers/api";

import React from "react";
import { connect } from "react-redux";

const withApi = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    apiUrl: getApiUrl(state),
    apiStatus: getApiStatus(state),
    attempt: getApiAttempt(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setApiStatus: (bool) => dispatch(setApiStatus(bool)),
    setAttempt: (value) => setApiAttempt(value),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withApi;
