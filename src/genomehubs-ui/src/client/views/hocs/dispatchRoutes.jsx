import { cancelPages, getPages } from "../reducers/pages";

import React from "react";
import { connect } from "react-redux";
import { setRoutes } from "../reducers/routes";

const withRoutes = (WrappedComponent) => (props) => {
  const mapDispatchToProps = (dispatch) => ({
    setRoute: (routeName, pageId) => dispatch(setRoutes({ routeName, pageId })),
  });

  const Connected = connect(() => ({}), mapDispatchToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withRoutes;
