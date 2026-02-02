import { connect } from "react-redux";
import { fetchTypes } from "#selectors/types";
import { resetTypes } from "#reducers/types";

const dispatchTypes = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});
  const mapDispatchToProps = (dispatch) => ({
    fetchTypes: (result, taxonomy) => dispatch(fetchTypes(result, taxonomy)),
    resetTypes: () => dispatch(resetTypes()),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default dispatchTypes;
