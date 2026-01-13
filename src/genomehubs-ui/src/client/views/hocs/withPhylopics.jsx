import {
  getPhylopicByTaxonId,
  getPhylopicIsFetching,
  getPhylopics,
} from "#reducers/phylopic";

import { connect } from "react-redux";
import { fetchPhylopic } from "#selectors/phylopic";

const withPhylopics = (WrappedComponent) => (props) => {
  let { currentRecord, record } = props;
  record = currentRecord || record;
  let { taxon_id: taxonId } = record ? record.record : {};
  const mapStateToProps = (state) => ({
    phylopics: getPhylopics(state),
    phylopicIsFetching: getPhylopicIsFetching(state),
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
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withPhylopics;
