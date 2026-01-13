import {
  setHighlightPointLocation,
  setZoomPointLocation,
} from "#reducers/geography";

import { connect } from "react-redux";

const dispatchGeography = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});
  const mapDispatchToProps = (dispatch) => ({
    setHighlightPointLocation: (coords) =>
      dispatch(setHighlightPointLocation(coords)),
    setZoomPointLocation: (coords) => dispatch(setZoomPointLocation(coords)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default dispatchGeography;
