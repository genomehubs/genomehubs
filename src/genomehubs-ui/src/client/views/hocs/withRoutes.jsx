import { cancelPages, getPages } from "../reducers/pages";

import React from "react";
import { connect } from "react-redux";
import { getRoutes, setRoutes } from "../reducers/routes";
import { getRoutesById } from "../selectors/routes";

const withRoutes = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    routes: getRoutes(state),
    ...(props.routeName && {
      routesById: getRoutesById(state, props.routeName),
    }),
  });
  const mapDispatchToProps = (dispatch) => ({
    setRoute: (routeName, pageId) => dispatch(setRoutes({ routeName, pageId })),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withRoutes;
