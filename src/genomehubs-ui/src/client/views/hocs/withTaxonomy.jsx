import {
  getCurrentTaxonomy,
  getTaxonomies,
  getTaxonomiesFetching,
  setCurrentTaxonomy,
} from "../reducers/taxonomy";

import React from "react";
import { connect } from "react-redux";
import { fetchTaxonomies } from "../selectors/taxonomy";

const withTaxonomy = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    taxonomy: getCurrentTaxonomy(state),
    taxonomies: getTaxonomies(state),
    taxonomyIsFetching: getTaxonomiesFetching(state),
  });

  const mapDispatchToProps = (dispatch) => ({
    fetchTaxonomies: () => dispatch(fetchTaxonomies()),
    setTaxonomy: (taxonomyId) => dispatch(setCurrentTaxonomy(taxonomyId)),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withTaxonomy;
