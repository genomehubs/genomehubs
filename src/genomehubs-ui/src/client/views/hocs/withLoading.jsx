import { getLoading, setLoading } from "#reducers/loading";

import { connect } from "react-redux";

const withLoading = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    loading: getLoading(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setLoading: (status) => dispatch(setLoading(status)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withLoading;
