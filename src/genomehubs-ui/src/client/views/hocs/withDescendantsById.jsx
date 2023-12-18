import {
  fetchDescendants,
  getDescendantsByTaxonId,
} from "../reducers/descendants";

import React from "react";
import { connect } from "react-redux";

const withDescendantsById = (WrappedComponent) => (props) => {
  let { currentRecordId: taxonId } = props;
  // record = currentRecord || record;
  // let { taxon_id: taxonId } = record ? record.record : {};
  const mapStateToProps = (state) => ({
    ...(taxonId && {
      descendantsById: getDescendantsByTaxonId(state, taxonId),
    }),
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchDescendants: ({ taxonId, taxonomy, depth, rank }) => {
      dispatch(fetchDescendants({ taxonId, taxonomy, depth, rank }));
    },
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withDescendantsById;
