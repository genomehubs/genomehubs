import { fetchPhylopic, getPhylopicByTaxonId } from "../reducers/phylopic";

import React from "react";
import { connect } from "react-redux";

const withPhylopicsById = (WrappedComponent) => (props) => {
  let { currentRecord, record } = props;
  record = currentRecord || record;
  let { taxon_id: taxonId } = record ? record.record : {};
  const mapStateToProps = (state) => ({
    ...(taxonId && {
      phylopicById: getPhylopicByTaxonId(state, taxonId),
    }),
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchPhylopic: ({ taxonId, scientificName, lineage, rank }) => {
      dispatch(fetchPhylopic({ taxonId, scientificName, lineage, rank }));
    },
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withPhylopicsById;