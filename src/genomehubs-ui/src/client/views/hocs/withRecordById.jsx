import {
  getCurrentRecordId,
  getRecordById,
  getRecordIsFetching,
  resetRecord,
  setAttributeSettings,
  setCurrentRecordId,
} from "#reducers/record";

import { connect } from "react-redux";
import { fetchRecord } from "#selectors/record";

const withRecordById = (WrappedComponent) => (props) => {
  let { currentRecordId } = props;
  const mapStateToProps = (state) => ({
    recordId: getCurrentRecordId(state),
    recordIsFetching: false, //getRecordIsFetching(state),
    recordById: getRecordById(state, currentRecordId || ""),
  });

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

export default withRecordById;
