import {
  fetchRecord,
  resetRecord,
  setCurrentRecordId,
} from "../reducers/record";

import React from "react";
import { connect } from "react-redux";

const dispatchRecord = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});

  const mapDispatchToProps = (dispatch) => ({
    fetchRecord: (recordId, result, taxonomy, callback) =>
      dispatch(fetchRecord(recordId, result, taxonomy, callback)),
    resetRecord: () => dispatch(resetRecord()),
    setRecordId: (recordId) => dispatch(setCurrentRecordId(recordId)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default dispatchRecord;
