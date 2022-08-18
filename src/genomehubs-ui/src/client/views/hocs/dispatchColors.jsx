import React from "react";
import { connect } from "react-redux";
import { selectPalette } from "../reducers/color";

const dispatchColors = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});

  const mapDispatchToProps = (dispatch) => ({
    selectPalette: (name) => dispatch(selectPalette(name || "default")),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default dispatchColors;
