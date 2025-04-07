import { cancelPages, getPages } from "../reducers/pages";
import { getRoutes, setRoutes } from "../reducers/routes";

import React from "react";
import { connect } from "react-redux";
import { getRoutesById } from "../selectors/routes";

const withRoutes = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    routes: getRoutes(state),
    ...(props.routeName && {
      routesById: getRoutesById(state, props.routeName),
    }),
  });
  const mapDispatchToProps = (dispatch) => ({
    setRoute: (routeName, pageId, path) => {
      let fullPath;
      if (path && path.length > 0) {
        fullPath = path.replace(/\/$/, "") + "/" + routeName;
      } else {
        fullPath = routeName.startsWith("/") ? routeName : `/${routeName}`;
      }
      return dispatch(
        setRoutes({
          routeName,
          pageId,
          fullPath,
        }),
      );
    },
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withRoutes;
