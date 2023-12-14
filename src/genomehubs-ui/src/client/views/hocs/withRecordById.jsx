import {
  fetchRecord,
  getCurrentRecordId,
  getRecordById,
  resetRecord,
  setAttributeSettings,
  setCurrentRecordId,
} from "../reducers/record";

import React from "react";
import { connect } from "react-redux";

const withRecordById = (WrappedComponent) => (props) => {
  let { currentRecordId } = props;
  const mapStateToProps = (state) => ({
    recordId: getCurrentRecordId(state),
    recordById: getRecordById(state, currentRecordId || ""),
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchRecord: (recordId, result, taxonomy, callback) =>
      dispatch(fetchRecord(recordId, result, taxonomy, callback)),
    resetRecord: () => dispatch(resetRecord()),
    setRecordId: (recordId) => dispatch(setCurrentRecordId(recordId)),
    setAttributeSettings: (obj) => dispatch(setAttributeSettings(obj)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withRecordById;
