import React from "react";
import { connect } from "react-redux";
import { siteName } from "../reducers/location";

const withSiteName = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    siteName,
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withSiteName;
