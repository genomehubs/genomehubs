import {
  getHighlightPointLocation,
  setHighlightPointLocation,
} from "#reducers/geography";

import React from "react";
import { connect } from "react-redux";

const withGeography = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    highlightPointLocation: getHighlightPointLocation(state),
  });
  const mapDispatchToProps = (dispatch) => ({
    setHighlightPointLocation: (coords) =>
      dispatch(setHighlightPointLocation(coords)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withGeography;
