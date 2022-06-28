import {
  getZoomPointLocation,
  setZoomPointLocation,
} from "../reducers/geography";

import React from "react";
import { connect } from "react-redux";

const withStableGeography = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    zoomPointLocation: getZoomPointLocation(state),
  });
  const mapDispatchToProps = (dispatch) => ({
    setZoomPointLocation: (coords) => dispatch(setZoomPointLocation(coords)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withStableGeography;
