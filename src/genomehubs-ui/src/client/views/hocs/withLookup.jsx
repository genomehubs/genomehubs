import { getLookupTerm, setLookupTerm } from "#reducers/lookup";

import { connect } from "react-redux";

const withLookup = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    lookupTerm: getLookupTerm(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setLookupTerm: (lookupTerm) =>
      dispatch(setLookupTerm(decodeURIComponent(lookupTerm))),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withLookup;
