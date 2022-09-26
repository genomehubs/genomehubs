import { cancelPages, getPages } from "../reducers/pages";
import { fetchPages, getPagesById } from "../selectors/pages";

import React from "react";
import { connect } from "react-redux";

const withPages = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => ({
    pages: getPages(state),
    ...(props.pageId && {
      pagesById: getPagesById(state, props.pageId),
    }),
  });
  const mapDispatchToProps = (dispatch) => ({
    fetchPages: (pageId) => dispatch(fetchPages(pageId)),
    cancelPages: () => dispatch(cancelPages()),
    resetPages: () => dispatch(resetPages()),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withPages;
