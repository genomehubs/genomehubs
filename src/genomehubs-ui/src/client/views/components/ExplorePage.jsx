import React, { memo, useEffect } from "react";

import Page from "./Page";
import ResultPanel from "./ResultPanel";
import TextPanel from "./TextPanel";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import withRecord from "../hocs/withRecord";
import withSearch from "../hocs/withSearch";
import withSummary from "../hocs/withSummary";
import withTaxonomy from "../hocs/withTaxonomy";
import withTypes from "../hocs/withTypes";

const ExplorePage = ({
  lineage,
  fetchRecord,
  record,
  searchById = {},
  summaryField,
  setSummaryField,
  setLookupTerm,
  setSearchIndex,
  fetchSearchResults,
  setRecordId,
  taxonomy,
  types,
}) => {
  let results = [];
  let taxon_id;
  if (lineage) {
    taxon_id = lineage.taxon.taxon_id;
  }
  let options = qs.parse(location.search.replace(/^\?/, ""));
  let hashTerm = decodeURIComponent(location.hash.replace(/^\#/, ""));
  let optionString = JSON.stringify(options);
  useEffect(() => {
    if (options.taxon_id && !record.isFetching) {
      if (!taxon_id) {
        fetchRecord({ recordId: options.taxon_id, ...options });
        setRecordId(options.taxon_id);
      } else if (
        options.taxon_id != taxon_id ||
        options.field_id != summaryField
      ) {
        fetchSearchResults({
          query: `tax_eq(${options.taxon_id})`,
          result: options.result,
          taxonomy: options.taxonomy,
          includeEstimates: true,
        });
        setSearchIndex(options.result);
        setSummaryField(options.field_id);
        if (hashTerm) {
          setLookupTerm(hashTerm);
        }
      }
    }
  }, [taxon_id, optionString]);

  let summary;
  if (types[summaryField]) {
    if (types[summaryField].bins) {
      summary = "histogram";
    } else if (types[summaryField].type == "keyword") {
      summary = "terms";
    }
  }

  if (taxon_id) {
    let summaryId;
    if (summaryField && types[summaryField]) {
      summaryId = `${taxon_id}--${summaryField}--${summary}--${options.taxonomy}`;
    }
    results.push(
      <ResultPanel
        key={taxon_id}
        {...searchById}
        {...lineage.taxon}
        summaryId={summaryId}
        summary={summary}
      />,
    );
  }
  if (lineage) {
    lineage.lineage.forEach((ancestor, i) => {
      let summaryId;
      if (summaryField) {
        summaryId = `${ancestor.taxon_id}--${summaryField}--${summary}--${options.taxonomy}`;
      }

      results.push(
        <ResultPanel
          key={ancestor.taxon_id}
          {...ancestor}
          summaryId={summaryId}
          sequence={i + 1}
          summary={summary}
        />,
      );
    });
  }

  let text = <TextPanel pageId={"explore.md"}></TextPanel>;

  return (
    <Page
      searchBox
      panels={[{ panel: results }]}
      text={text}
      fieldId={summaryField}
    />
  );
};

export default compose(
  memo,
  withTaxonomy,
  withRecord,
  withSearch,
  withTypes,
  withSummary,
  dispatchLookup,
)(ExplorePage);
