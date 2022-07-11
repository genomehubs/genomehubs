import React, { memo, useEffect } from "react";

import AnalysisPanel from "./AnalysisPanel";
import AssembliesPanel from "./AssembliesPanel";
import AttributePanel from "./AttributePanel";
import LineagePanel from "./LineagePanel";
import NamesPanel from "./NamesPanel";
import Page from "./Page";
import ResultPanel from "./ResultPanel";
import TextPanel from "./TextPanel";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import { getRecordIsFetching } from "../reducers/record";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import withRecord from "../hocs/withRecord";
import withSearch from "../hocs/withSearch";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

const RecordPage = ({
  location,
  record,
  recordId,
  fetchRecord,
  recordIsFetching,
  setRecordId,
  setLookupTerm,
  fetchSearchResults,
  setSearchIndex,
  setPreviousSearchTerm,
  searchIndex,
  setTaxonomy,
  taxonomy,
  types,
  searchById = {},
}) => {
  const changeRecordUrl = (recordId, result, taxonomy, hashTerm) => {
    const navigate = useNavigate();
    let hash;
    if (hashTerm) {
      hash = `#${encodeURIComponent(hashTerm)}`;
    } else {
      hash = location.hash || "";
    }
    navigate(
      `?recordId=${recordId}&result=${result}&taxonomy=${taxonomy}${hash}`,
      { replace: true }
    );
  };

  let results = [];
  let taxon = {};
  let options = qs.parse(location.search.replace(/^\?/, ""));
  let hashTerm = decodeURIComponent(location.hash.replace(/^\#/, ""));
  useEffect(() => {
    if (options.result != searchIndex) {
      setSearchIndex(options.result);
    }
    if (options.recordId && options.recordId != recordId) {
      setRecordId(options.recordId);
      let searchTerm = {
        result: options.result,
        includeEstimates: true,
        taxonomy: options.taxonomy || taxonomy,
        fields: "all",
      };
      if (options.result == "taxon") {
        searchTerm.query = `tax_eq(${options.recordId})`;
      } else {
        searchTerm.query = options.recordId;
      }
      setPreviousSearchTerm(searchTerm);
      fetchSearchResults(searchTerm);
    } else if (recordId) {
      if (
        options.result == "taxon" &&
        (!record.record ||
          recordId != record.record.taxon_id ||
          options.taxonomy != taxonomy)
      ) {
        if (!recordIsFetching) {
          fetchRecord(
            recordId,
            options.result,
            options.taxonomy,
            changeRecordUrl
          );
        }
        if (hashTerm) {
          setLookupTerm(hashTerm);
        }
      } else if (
        options.result == "assembly" &&
        (!record.record || recordId != record.record.assembly_id)
      ) {
        if (!recordIsFetching) {
          fetchRecord(
            recordId,
            options.result,
            options.taxonomy,
            changeRecordUrl
          );
        }
        if (hashTerm) {
          setLookupTerm(hashTerm);
        }
      } else if (
        options.result == "sample" &&
        (!record.record || recordId != record.record.sample_id)
      ) {
        if (!recordIsFetching) {
          fetchRecord(
            recordId,
            options.result,
            options.taxonomy,
            changeRecordUrl
          );
        }
        if (hashTerm) {
          setLookupTerm(hashTerm);
        }
      } else if (
        options.result == "feature" &&
        (!record.record || recordId != record.record.feature_id)
      ) {
        if (!recordIsFetching) {
          fetchRecord(
            recordId,
            options.result,
            options.taxonomy,
            changeRecordUrl
          );
        }
        if (hashTerm) {
          setLookupTerm(hashTerm);
        }
      }
    }
  }, [options]);
  if (record && record.record && record.record.taxon_id) {
    taxon = {
      taxon_id: record.record.taxon_id,
      scientific_name: record.record.scientific_name,
      taxon_rank: record.record.taxon_rank,
    };
    results.push(
      <ResultPanel key={taxon.taxon_id} {...searchById} {...taxon} />
    );
    if (options.result == "taxon") {
      if (record.record.lineage) {
        results.push(
          <LineagePanel
            key={"lineage"}
            taxon_id={taxon.taxon_id}
            lineage={record.record.lineage.slice().reverse()}
          />
        );
      }
      if (record.record.taxon_names) {
        results.push(
          <NamesPanel
            key={"names"}
            taxon_id={taxon.taxon_id}
            names={record.record.taxon_names}
          />
        );
      }
    }
    if (options.result == "sample") {
      results.push(
        <AssembliesPanel
          key={"assemblies"}
          recordId={record.record.record_id}
          result={options.result}
          taxonomy={options.taxonomy}
        />
      );
    } else {
      results.push(
        <AnalysisPanel
          key={"analysis"}
          recordId={record.record.record_id}
          result={options.result}
          taxonomy={options.taxonomy}
        />
      );
    }

    if (record.record.attributes) {
      results.push(
        <AttributePanel
          key={"attributes"}
          taxonId={taxon.taxon_id}
          attributes={record.record.attributes}
          result={options.result}
        />
      );
    }
  }

  let text = <TextPanel pageId={"record.md"}></TextPanel>;

  return (
    <Page
      id={"record-page"}
      result={options.result}
      recordId={recordId}
      searchBox
      panels={[{ panel: results }]}
      text={text}
    />
  );
};

export default compose(
  memo,
  withTaxonomy,
  withRecord,
  withSearch,
  dispatchLookup,
  withTypes
)(RecordPage);
