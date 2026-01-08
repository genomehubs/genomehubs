import React, { memo, useEffect } from "react";

import AnalysisPanel from "./AnalysisPanel";
import AssembliesPanel from "./AssembliesPanel";
import AssemblyPanel from "./AssemblyPanel";
import AttributePanel from "./AttributePanel";
import FeaturePanel from "./FeaturePanel";
import FilesPanel from "./FilesPanel";
import LineagePanel from "./LineagePanel";
import NamesPanel from "./NamesPanel";
import Page from "./Page";
import ResultPanel from "./ResultPanel";
import TaxonPanel from "./TaxonPanel";
import TaxonSummaryPanel from "./TaxonSummaryPanel";
import TextPanel from "./TextPanel";
import classnames from "classnames";
import { compose } from "redux";
import dispatchLookup from "../hocs/dispatchLookup";
import { getRecordIsFetching } from "../reducers/record";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import { ucFirst } from "../functions/formatter";
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
      { replace: true },
    );
  };

  let results = [];
  let taxon = {};
  let groups = Object.values(types).map((obj) => obj.display_group);
  let options = qs.parse(location.search.replace(/^\?/, ""));
  let hashTerm = decodeURIComponent(location.hash.replace(/^\#/, ""));
  useEffect(() => {
    if (options.result != searchIndex) {
      setSearchIndex(options.result);
    }
    if (options.recordId && options.recordId != recordId) {
      setRecordId(options.recordId);
      let fields;
      let ranks;
      if (options.groups) {
        let wanted_groups = options.groups.split(",");
        let groupFields = [];
        for (let [key, type] of Object.entries(types)) {
          if (
            type.display_group &&
            wanted_groups.includes(type.display_group) &&
            type.display_level >= 1
          ) {
            groupFields.push(key);
            groups.push(type.display_group);
          }
        }
        if (groupFields.length) {
          fields = groupFields.join(",");
        } else {
          fields = "";
        }
      }
      let searchTerm = {
        result: options.result,
        includeEstimates: true,
        taxonomy: options.taxonomy || taxonomy,
        fields,
        // ranks,
      };
      if (options.result == "taxon") {
        searchTerm.query = `tax_name(${options.recordId})`;
      } else {
        searchTerm.query = `${options.result}_id=${options.recordId}`;
      }
      setPreviousSearchTerm(searchTerm);
      fetchSearchResults(searchTerm);
    } else if (
      recordId &&
      (!record.record ||
        recordId != record.record[`${options.result}_id`] ||
        options.taxonomy != taxonomy)
    ) {
      if (!recordIsFetching) {
        fetchRecord({
          ...options,
          recordId,
          callback: changeRecordUrl,
        });
      }
      if (hashTerm) {
        setLookupTerm(hashTerm);
      }
    }
  }, [location.search]);
  if (record && record.record && record.record.taxon_id) {
    taxon = {
      taxon_id: record.record.taxon_id,
      scientific_name: record.record.scientific_name,
      taxon_rank: record.record.taxon_rank,
    };
    if (options.result == "taxon") {
      results.push(
        <ResultPanel key={taxon.taxon_id} {...searchById} {...taxon} />,
      );

      // results.push(<TaxonSummaryPanel key={"taxon_summary"} {...taxon} />);

      if (record.record.lineage) {
        results.push(
          <LineagePanel
            key={"lineage"}
            taxon_id={taxon.taxon_id}
            lineage={record.record.lineage.slice().reverse()}
            result={options.result}
          />,
        );
      }
      if (record.record.taxon_names) {
        results.push(
          <NamesPanel
            key={"names"}
            taxon_id={taxon.taxon_id}
            names={record.record.taxon_names}
          />,
        );
      }
    }

    if (options.result == "assembly" || options.result == "feature") {
      if (options.result == "feature") {
        results.push(
          <FeaturePanel
            key={"feature"}
            recordId={record.record.record_id}
            result={options.result}
            taxonomy={options.taxonomy}
          />,
        );
      }
      results.push(
        <AssemblyPanel
          key={"assembly"}
          recordId={record.record.record_id}
          assemblyId={record.record.assembly_id}
          result={options.result}
          taxonomy={options.taxonomy}
        />,
      );
    } else if (options.result == "sample") {
      results.push(
        <AssembliesPanel
          key={"assemblies"}
          recordId={record.record.record_id}
          result={options.result}
          taxonomy={options.taxonomy}
        />,
      );
    }
    if (options.result != "taxon") {
      results.push(
        <TaxonPanel
          key={"taxon"}
          recordId={record.record.record_id}
          {...record.record}
          result={options.result}
          taxonomy={options.taxonomy}
        />,
      );
    }

    if (options.result == "taxon" || options.result == "assembly") {
      results.push(
        <AnalysisPanel
          key={"analysis"}
          recordId={record.record.record_id}
          result={options.result}
          taxonomy={options.taxonomy}
        />,
      );
    }

    if (record.record.attributes) {
      if (record.record.attributes.files && options.result == "assembly") {
        results.push(
          <FilesPanel
            key={"files"}
            recordId={record.record.record_id}
            result={options.result}
            taxonomy={options.taxonomy}
            files={record.record.attributes.files}
          />,
        );
      }
      groups = [...new Set(groups.filter((group) => group && group.length))];
      for (let group of groups) {
        let groupAttributes = Object.entries(record.record.attributes)
          .filter(([key, value]) => {
            return types[key]?.display_group === group;
          })
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});

        if (Object.keys(groupAttributes).length) {
          results.push(
            <AttributePanel
              key={group}
              title={`${ucFirst(group).replace(/_/g, " ")} attributes`}
              taxonId={taxon.taxon_id}
              attributes={groupAttributes}
              result={options.result}
            />,
          );
        }
      }
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
  withTypes,
)(RecordPage);
