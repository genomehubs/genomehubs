import React, { useEffect } from "react";
import { useLocation, useNavigate } from "@reach/router";

import Grid from "@material-ui/core/Grid";
import { LineageList } from "./LineagePanel";
import NavLink from "./NavLink";
import Tooltip from "@material-ui/core/Tooltip";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import withRecord from "../hocs/withRecord";
import withSearch from "../hocs/withSearch";
import withSiteName from "../hocs/withSiteName";

const TaxonPanel = ({
  scientific_name,
  recordIsFetching,
  records,
  fetchRecord,
  setRecordId,
  setLookupTerm,
  taxon_id,
  lineage,
  taxon_rank,
  fetchSearchResults,
  setPreferSearchTerm,
  taxonomy,
  basename,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  let options = qs.parse(location.search.replace(/^\?/, ""));

  let lineages;
  let taxidLink;
  if (taxon_id) {
    if (!scientific_name) {
      if (records[taxon_id]) {
        scientific_name = records[taxon_id].record.scientific_name;
        taxon_rank = records[taxon_id].record.taxon_rank;
        lineage = {
          taxon: { taxon_id, scientific_name, taxon_rank },
          lineage: records[taxon_id].record.lineage,
        };
      }
    }
    if (taxonomy == "ncbi" && taxon_id.match(/^\d+$/)) {
      let taxidUrl = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${taxon_id}`;
      taxidLink = (
        <>
          View taxon in{" "}
          <span style={{ textDecoration: "underline" }}>
            <NavLink href={taxidUrl}>NCBI taxonomy</NavLink>
          </span>
        </>
      );
    }
  }

  if (lineage && lineage.lineage) {
    lineages = (
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
  }

  useEffect(() => {
    if (taxon_id && !scientific_name && !recordIsFetching) {
      fetchRecord(taxon_id, "taxon", options.taxonomy || taxonomy || "ncbi");
    }
  }, [taxon_id]);

  const handleTaxonClick = () => {
    setPreferSearchTerm(false);
    navigate(
      `${basename}/record?recordId=${taxon_id}&result=taxon&taxonomy=${
        options.taxonomy || taxonomy
      }#${encodeURIComponent(scientific_name)}`
    );
    // setRecordId(taxon_id);
  };

  let css = classnames(
    styles.infoPanel,
    styles[`infoPanel1Column`],
    styles.resultPanel
  );

  return (
    <div className={css}>
      <Tooltip title={"Click to view full taxon record"} arrow placement="top">
        <div className={styles.header} onClick={handleTaxonClick}>
          <span className={styles.title}>Taxon — {scientific_name}</span>
          <span> ({taxon_rank})</span>
          <span className={styles.identifier}>
            <span className={styles.identifierPrefix}>taxId:</span>
            {taxon_id}
          </span>
        </div>
      </Tooltip>

      <div>
        <Grid container alignItems="center" direction="column" spacing={1}>
          {/* <div className={styles.flexRow}>{fieldDivs}</div>
        {additionalDivs.length > 0 && (
          <div className={styles.flexRow}>{additionalDivs}</div>
        )} */}
          <Grid item style={{ width: "100%" }}>
            {lineages}
          </Grid>
          {taxidLink && (
            <>
              <Grid container direction="row" justifyContent="flex-end">
                <Grid item>{taxidLink}</Grid>
              </Grid>
            </>
          )}
        </Grid>
      </div>
    </div>
  );
};

export default compose(
  withSiteName,
  withSearch,
  withRecord,
  dispatchLookup
)(TaxonPanel);
