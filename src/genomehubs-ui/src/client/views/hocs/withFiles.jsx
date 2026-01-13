import { cancelFiles, getFiles, resetFiles } from "#reducers/file";

import { connect } from "react-redux";
import { fetchFiles } from "#selectors/file";

const withFiles = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    files: getFiles(state),
  });
  const mapDispatchToProps = (dispatch) => ({
    fetchFiles: (options) => dispatch(fetchFiles(options)),
    cancelFiles: () => dispatch(cancelFiles()),
    resetFiles: () => dispatch(resetFiles()),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withFiles;
