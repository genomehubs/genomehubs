import React from "react";
import { connect } from "react-redux";
import { setHighlightPointLocation } from "../reducers/geography";

const dispatchGeography = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});
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

export default dispatchGeography;
