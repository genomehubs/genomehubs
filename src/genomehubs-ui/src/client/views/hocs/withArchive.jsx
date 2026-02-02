import { archive } from "#reducers/archive";
import { connect } from "react-redux";

const withArchive = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    archive,
  });

  const Connected = connect(mapStateToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default withArchive;
