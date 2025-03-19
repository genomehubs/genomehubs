import {
    getPhylopicByTaxonId,
    getPhylopicIsFetching,
    getPhylopics,
    receivePhylopic,
    requestPhylopic,
  } from "../reducers/phylopic";
  
  import React from "react";
  import { connect } from "react-redux";
  import { fn } from "@storybook/test";
  
  const mockFetchPhylopic = ({ taxonId, scientificName, lineage, rank }) => {
    return async function(dispatch) {
      dispatch(requestPhylopic(taxonId));
      const mockPhylopic = {
        taxonId,
        scientificName,
        lineage,
        rank,
        source: "Mock",
        attribution: "Mock Attribution",
        dataUri: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iMTIiIHk9IjEyIiBmb250LXNpemU9IjEwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzU1NSI+TW9jazwvdGV4dD48L3N2Zz4="
      };
      
      setTimeout(() => {
        dispatch(receivePhylopic(mockPhylopic));
      }, 100);
    };
  };
  
  const mockWithPhylopics = (WrappedComponent) => (props) => {
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
      fetchPhylopic: (params) => {
        dispatch(mockFetchPhylopic(params));
      },
    });
  
    const Connected = connect(
      mapStateToProps,
      mapDispatchToProps
    )(WrappedComponent);
  
    return <Connected {...props} />;
  };
  
  export const withPhylopics = fn(mockWithPhylopics).mockName("withPhylopics");
  
  export default withPhylopics;