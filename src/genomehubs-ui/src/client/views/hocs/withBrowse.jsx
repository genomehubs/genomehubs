import { getBrowse, setBrowseStatus } from "#reducers/record";

import { connect } from "react-redux";
import { updateBrowse } from "#selectors/record";

const withBrowse = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    browse: getBrowse(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setBrowse: (parents) => {
      dispatch(updateBrowse(parents));
    },
    updateBrowseStatus: (id, value) => {
      dispatch(setBrowseStatus({ id, value }));
    },
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withBrowse;
