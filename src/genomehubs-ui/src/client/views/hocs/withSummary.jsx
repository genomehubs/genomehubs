import { getSummaryField, setSummaryField } from "../reducers/explore";

import React from "react";
import { connect } from "react-redux";
import { fetchSummary } from "../selectors/explore";

const withSummary = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    summaryField: getSummaryField(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchSummary: (taxon, field, summary, taxonomy, result) => {
      dispatch(fetchSummary(taxon, field, summary, taxonomy, result));
    },
    setSummaryField: (field) => dispatch(setSummaryField(field)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withSummary;
