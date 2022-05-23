import React from "react";
import { connect } from "react-redux";
import { fetchSearchResults } from "../selectors/search";
import { setCurrentRecordId } from "../reducers/record";
import { setLookupTerm } from "../reducers/lookup";
import { setPreferSearchTerm } from "../reducers/search";

const dispatchSetRecord = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({});
  const mapDispatchToProps = (dispatch) => ({
    setRecord: ({ id, name, currentId, result, taxonomy, navigate }) => {
      if (id != currentId) {
        dispatch(setCurrentRecordId(id));
        dispatch(fetchSearchResults({ query: id, result }));
        dispatch(setPreferSearchTerm(false));
        if (navigate) {
          navigate(
            `?recordId=${id}&result=${result}&taxonomy=${taxonomy}#${encodeURIComponent(
              name || id
            )}`
          );
        }
        dispatch(setLookupTerm(name || id));
      }
    },
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default dispatchSetRecord;
