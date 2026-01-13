import { getMessage, setMessage } from "#reducers/message";

import { connect } from "react-redux";

const withMessage = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    message: getMessage(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setMessage: (message) => {}, //dispatch(setMessage(message)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withMessage;
