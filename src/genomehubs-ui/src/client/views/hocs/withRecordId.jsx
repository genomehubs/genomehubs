import React from "react";
import { connect } from "react-redux";
import { getCurrentRecordId } from "../reducers/record";

const withRecordId = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    recordId: getCurrentRecordId(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    setRecordId: (recordId) => dispatch(setCurrentRecordId(recordId)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withRecordId;
