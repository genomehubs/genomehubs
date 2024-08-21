import {
  getDescendantsByTaxonId,
  getDescendantsIsFetchingByTaxonId,
} from "../reducers/descendants";

import React from "react";
import { connect } from "react-redux";
import { fetchDescendants } from "../selectors/descendants";

const withDescendantsById = (WrappedComponent) => (props) => {
  let { currentRecordId: taxonId } = props;
  // record = currentRecord || record;
  // let { taxon_id: taxonId } = record ? record.record : {};
  const mapStateToProps = (state) => ({
    ...(taxonId && {
      descendantsIsFetchingById: getDescendantsIsFetchingByTaxonId(
        state,
        taxonId
      ),
      descendantsById: getDescendantsByTaxonId(state, taxonId),
    }),
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchDescendants: ({ taxonId, taxonomy, depth, rank, offset, size }) => {
      dispatch(
        fetchDescendants({ taxonId, taxonomy, depth, rank, offset, size })
      );
    },
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withDescendantsById;
