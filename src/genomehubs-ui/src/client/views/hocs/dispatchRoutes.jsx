import { cancelPages, getPages } from "#reducers/pages";

import { connect } from "react-redux";
import { setRoutes } from "#reducers/routes";

const withRoutes = (WrappedComponent) => (props) => {
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

  const Connected = connect(() => ({}), mapDispatchToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withRoutes;
