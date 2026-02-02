import { connect } from "react-redux";
import { setSuggestedTerms } from "#reducers/search";

const dispatchTerms = (WrappedComponent) => (props) => {
  const mapDispatchToProps = (dispatch) => ({
    setRoute: (obj) => dispatch(setSuggestedTerms(obj)),
  });

  const Connected = connect(() => ({}), mapDispatchToProps)(WrappedComponent);

  return <Connected {...props} />;
};

export default dispatchTerms;
