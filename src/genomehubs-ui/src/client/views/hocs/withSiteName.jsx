import { getBasename, getSitename } from "../reducers/location";

import React from "react";
import { connect } from "react-redux";

const withSiteName = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    siteName: getSitename(),
    basename: getBasename(),
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withSiteName;
