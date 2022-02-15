import React from "react";
import { apiUrl } from "../reducers/api";
import { connect } from "react-redux";

const withApiUrl = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    apiUrl: apiUrl,
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withApiUrl;
