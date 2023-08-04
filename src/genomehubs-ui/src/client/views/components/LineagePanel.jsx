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
  fetchSearchResults,
  setPreferSearchTerm,
  setLookupTerm,
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
          `${taxon}[${name}]`
        )}`
      );
      setLookupTerm(name);
    }
  };

  let lineageDivs = [];

  if (lineage && lineage.lineage) {
    lineage.lineage.forEach((ancestor) => {
      lineageDivs.unshift(
        <Tooltip
          title={`${ancestor.taxon_rank} [taxid: ${ancestor.taxon_id}]`}
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
            {ancestor.scientific_name}
          </span>
        </Tooltip>
      );
    });
  }

  return <div style={{ maxWidth: "100%" }}>{lineageDivs}</div>;
};

const LineagePanel = ({
  taxon_id,
  setRecordId,
  lineage,
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
