import {
  resetRecord,
  setAttributeSettings,
  setCurrentRecordId,
} from "#reducers/record";

import { connect } from "react-redux";
import { fetchRecord } from "#selectors/record";

const dispatchRecord = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});

  const mapDispatchToProps = (dispatch) => ({
    fetchRecord: (options) => dispatch(fetchRecord(options)),
    resetRecord: () => dispatch(resetRecord()),
    setRecordId: (recordId) => dispatch(setCurrentRecordId(recordId)),
    setAttributeSettings: (obj) => dispatch(setAttributeSettings(obj)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default dispatchRecord;
