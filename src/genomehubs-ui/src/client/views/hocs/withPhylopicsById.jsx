import { connect } from "react-redux";
import { fetchPhylopic } from "#selectors/phylopic";
import { getPhylopicByTaxonId } from "#reducers/phylopic";

const withPhylopicsById = (WrappedComponent) => (props) => {
  let {
    record,
    currentRecord = record,
    taxonId = currentRecord.record?.taxon_id,
  } = props;
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
    mapDispatchToProps,
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withPhylopicsById;
