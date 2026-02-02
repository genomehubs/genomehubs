import {
  apiUrl,
  getApiAttempt,
  getApiStatus,
  setApiAttempt,
  setApiStatus,
} from "#reducers/api";

import { connect } from "react-redux";

const withApi = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    apiUrl,
    apiStatus: getApiStatus(state),
    attempt: getApiAttempt(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setApiStatus: (bool) => dispatch(setApiStatus(bool)),
    setAttempt: (value) => setApiAttempt(value),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withApi;
