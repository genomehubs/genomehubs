import React from "react";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import { format } from "d3-format";
import qs from "qs";
import styles from "./Styles.scss";
import { useNavigate } from "@reach/router";
import withRecord from "../hocs/withRecord";
import withSearch from "../hocs/withSearch";
import withTaxonomy from "../hocs/withTaxonomy";

const LineagePanel = ({
  taxon_id,
  setRecordId,
  lineage,
  fetchSearchResults,
  setPreferSearchTerm,
  setLookupTerm,
  resetLookup,
  taxonomy,
}) => {
  const navigate = useNavigate();

  const handleTaxonClick = (taxon, name) => {
    if (taxon != taxon_id) {
      setRecordId(taxon);
      fetchSearchResults({ query: `tax_eq(${taxon})`, result: "taxon" });
      setPreferSearchTerm(false);
      navigate(
        `?recordId=${taxon}&result=taxon&taxonomy=${taxonomy}#${encodeURIComponent(
          name
        )}`
      );
      setLookupTerm(name);
    }
  };

  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );
  let lineageDivs = [];
  if (lineage && lineage.lineage) {
    lineage.lineage.forEach((ancestor) => {
      lineageDivs.unshift(
        <span
          key={ancestor.taxon_id}
          className={styles.lineage}
          onClick={() =>
            handleTaxonClick(ancestor.taxon_id, ancestor.scientific_name)
          }
          title={`${ancestor.taxon_rank}: ${ancestor.scientific_name} [taxid: ${ancestor.taxon_id}]`}
        >
          {ancestor.scientific_name}
        </span>
      );
    });
  }

  return (
    <div className={css}>
      <div className={styles.header}>
        <span className={styles.title}>Lineage</span>
      </div>
      <div style={{ maxWidth: "100%" }}>{lineageDivs}</div>
    </div>
  );
};

export default compose(
  withTaxonomy,
  dispatchLookup,
  withSearch,
  withRecord
)(LineagePanel);
