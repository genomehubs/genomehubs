import React from "react";
import Tooltip from "./Tooltip";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import withRecord from "../hocs/withRecord";
import withSearch from "../hocs/withSearch";
import withTaxonomy from "../hocs/withTaxonomy";

export const LineageList = ({
  taxon_id,
  setRecordId,
  lineage,
  result,
  fetchSearchResults,
  setPreferSearchTerm,
  setLookupTerm,
  taxonomy,
}) => {
  const navigate = useNavigate();

  const handleTaxonClick = (taxon, name) => {
    if (taxon != taxon_id || result != "taxon") {
      setRecordId(taxon);
      fetchSearchResults({ query: `tax_eq(${taxon})`, result: "taxon" });
      setPreferSearchTerm(false);
      navigate(
        `?recordId=${taxon}&result=taxon&taxonomy=${taxonomy}#${encodeURIComponent(
          `${taxon}[${name}]`
        )}`
      );
      setLookupTerm(name);
    }
  };

  let lineageDivs = [];

  const fullRanks = new Set([
    "subpecies",
    "species",
    "genus",
    "family",
    "order",
    "class",
    "phylum",
    "kingdom",
    "superkingdom",
  ]);

  if (lineage && lineage.lineage) {
    lineage.lineage.forEach((ancestor) => {
      let rank = ancestor.taxon_rank == "clade" ? "" : ancestor.taxon_rank;
      let css = classnames(
        styles.rank,
        fullRanks.has(ancestor.taxon_rank) && styles.bold
      );
      let rankDiv = <div className={css}>{rank}</div>;

      lineageDivs.unshift(
        <Tooltip
          title={`taxid: ${ancestor.taxon_id}`}
          arrow
          placement="top"
          key={ancestor.taxon_id}
        >
          <span
            className={styles.lineage}
            onClick={() =>
              handleTaxonClick(ancestor.taxon_id, ancestor.scientific_name)
            }
          >
            {rankDiv}
            {ancestor.scientific_name}
          </span>
        </Tooltip>
      );
    });
  }
  let rank =
    lineage.taxon.taxon_rank == "clade" ? "" : lineage.taxon.taxon_rank;
  let css = classnames(
    styles.rank,
    fullRanks.has(lineage.taxon.taxon_rank) && styles.bold
  );
  let rankDiv = <div className={css}>{rank}</div>;
  lineageDivs.push(
    <span
      className={classnames(styles.lineage, styles.lineageDirect)}
      onClick={() =>
        handleTaxonClick(lineage.taxon.taxon_id, lineage.taxon.scientific_name)
      }
      key={lineage.taxon.taxon_id}
    >
      {rankDiv}
      {lineage.taxon.scientific_name}
    </span>
  );

  return <div style={{ maxWidth: "100%" }}>{lineageDivs}</div>;
};

const LineagePanel = ({
  taxon_id,
  setRecordId,
  lineage,
  result,
  fetchSearchResults,
  setPreferSearchTerm,
  setLookupTerm,
  taxonomy,
}) => {
  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );
  let lineages = (
    <LineageList
      taxon_id={taxon_id}
      setRecordId={setRecordId}
      lineage={lineage}
      fetchSearchResults={fetchSearchResults}
      setPreferSearchTerm={setPreferSearchTerm}
      setLookupTerm={setLookupTerm}
      taxonomy={taxonomy}
      result={result}
    />
  );

  return (
    <div className={css}>
      <div className={styles.header}>
        <span className={styles.title}>Lineage</span>
      </div>
      {lineages}
    </div>
  );
};

export default compose(
  withTaxonomy,
  dispatchLookup,
  withSearch,
  withRecord
)(LineagePanel);
