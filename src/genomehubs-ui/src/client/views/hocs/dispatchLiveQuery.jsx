import { connect } from "react-redux";
import { setLiveQuery } from "#reducers/lookup";

const dispatchLiveQuery = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});

  const mapDispatchToProps = (dispatch) => ({
    setLiveQuery: (queryTerm) => dispatch(setLiveQuery(queryTerm)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default dispatchLiveQuery;
