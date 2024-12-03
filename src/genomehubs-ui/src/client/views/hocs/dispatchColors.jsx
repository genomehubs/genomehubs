import React from "react";
import { connect } from "react-redux";
import { selectPalette } from "../reducers/color";

const dispatchColors = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});

  const mapDispatchToProps = (dispatch) => ({
    selectPalette: ({ id = "default", offset = 0, reverse = false }) => {
      dispatch(selectPalette({ id, offset, reverse }));
    },
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default dispatchColors;
