import { cancelPages, getPages } from "../reducers/pages";
import {
  fetchPages,
  getPagesById,
  getPagesIsFetchingById,
} from "../selectors/pages";

import React from "react";
import { connect } from "react-redux";

const withPages = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => {
    if (props.pageId) {
      return {
        pagesById: getPagesById(state, props.pgId || props.pageId),
        pagesIsFetching: getPagesIsFetchingById(
          state,
          props.pgId || props.pageId
        ),
      };
    } else {
      return {
        pages: getPages(state),
      };
    }
  };
  const mapDispatchToProps = (dispatch) => ({
    fetchPages: (pageId) => dispatch(fetchPages(pageId)),
    cancelPages: () => dispatch(cancelPages({ pageId })),
    resetPages: () => dispatch(resetPages({ pageId })),
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withPages;
