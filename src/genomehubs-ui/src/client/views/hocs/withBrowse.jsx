import {
  getBrowse,
  setBrowse,
  setBrowseStatus,
  updateBrowse,
} from "../reducers/record";

import React from "react";
import { connect } from "react-redux";

const withBrowse = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    browse: getBrowse(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setBrowse: (parents) => {
      dispatch(updateBrowse(parents));
    },
    updateBrowseStatus: (id, value) => {
      dispatch(setBrowseStatus({ id, value }));
    },
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withBrowse;
