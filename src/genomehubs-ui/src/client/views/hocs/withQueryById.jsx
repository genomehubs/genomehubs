import { getQueryResultById, resetQuery } from "#reducers/search";

import React from "react";
import { connect } from "react-redux";
import { fetchQueryResults } from "#selectors/search";
import qs from "#functions/qs";

const withQueryById = (WrappedComponent) => (props) => {
  const mapStateToProps = (state) => {
    let {
      apiUrl,
      suffix,
      suffix_plural,
      inline,
      of,
      description,
      basename,
      record,
      currentRecord,
      fetchSearchResults,
      searchById,
      children,
      apiStatus,
      attempt,
      setApiStatus,
      setAttempt,
      siteName,
      dispatch,
      attributeSettings,
      records,
      recordIsFetching,
      recordId,
      lineage,
      fetchRecord,
      resetRecord,
      setRecordId,
      setAttributeSettings,
      ...options
    } = props;
    let queryString = qs.stringify({ ...options });
    return {
      ...(queryString > "" && {
        queryById: getQueryResultById(state, queryString),
      }),
    };
  };

  const mapDispatchToProps = (dispatch) => ({
    fetchQueryResults: (options) => {
      if (options.query && options.query.length > 0) {
        let queryString = qs.stringify({ ...options });
        dispatch(fetchQueryResults(queryString));
      } else {
        dispatch(resetQuery());
      }
    },
  });

  const Connected = connect(
    mapStateToProps,
    mapDispatchToProps
  )(WrappedComponent);

  return <Connected {...props} />;
};

export default withQueryById;
