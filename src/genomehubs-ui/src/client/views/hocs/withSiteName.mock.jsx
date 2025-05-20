// import { basename, siteName } from "../reducers/location";

import React from "react";
import { connect } from "react-redux";

const withSiteName = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    siteName: "GoaT",
    basename: "/",
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withSiteName;
