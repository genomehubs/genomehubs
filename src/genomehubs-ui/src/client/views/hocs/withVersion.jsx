import { connect } from "react-redux";
import { getVersion } from "#selectors/types";

const withVersion = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    version: getVersion(state),
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withVersion;
