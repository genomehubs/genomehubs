import { connect } from "react-redux";
import { getMapThreshold } from "#reducers/map";

const withMapThreshold = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    mapThreshold: getMapThreshold(state),
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withMapThreshold;
