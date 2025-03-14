import React, { useEffect } from "react";
import {
  header as headerStyle,
  identifierPrefix as identifierPrefixStyle,
  identifier as identifierStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  resultPanel as resultPanelStyle,
  title as titleStyle,
} from "./Styles.scss";
import { useLocation, useNavigate } from "@reach/router";

import Grid from "@mui/material/Grid2";
import { LineageList } from "./LineagePanel";
import LineageSummaryPanel from "./LineageSummaryPanel";
import Tooltip from "./Tooltip";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import qs from "../functions/qs";
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
  result,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  let options = qs.parse(location.search.replace(/^\?/, ""));

  let lineages;
  let taxidLink;
  if (taxon_id) {
    if (records[taxon_id] && !scientific_name) {
      scientific_name = records[taxon_id].record.scientific_name;
      taxon_rank = records[taxon_id].record.taxon_rank;
      lineage = {
        taxon: { taxon_id, scientific_name, taxon_rank },
        lineage: records[taxon_id].record.lineage,
      };
    }
    if (taxonomy == "ncbi" && taxon_id.match(/^\d+$/)) {
      let taxidUrl = `https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${taxon_id}`;
      taxidLink = <LineageSummaryPanel taxonId={taxon_id} />;
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
        result={result}
      />
    );
  }

  useEffect(() => {
    if (taxon_id && !scientific_name && !recordIsFetching) {
      fetchRecord({
        recordId: taxon_id,
        result: "taxon",
        taxonomy: options.taxonomy || taxonomy || "ncbi",
      });
    }
  }, [taxon_id]);

  const handleTaxonClick = () => {
    setPreferSearchTerm(false);
    navigate(
      `${basename}/record?recordId=${taxon_id}&result=taxon&taxonomy=${
        options.taxonomy || taxonomy
      }#${encodeURIComponent(scientific_name)}`,
    );
    // setRecordId(taxon_id);
  };

  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle, resultPanelStyle);

  return (
    <div className={css}>
      <Tooltip title={"Click to view full taxon record"} arrow placement="top">
        <div className={headerStyle} onClick={handleTaxonClick}>
          <span className={titleStyle}>Taxon — {scientific_name}</span>
          <span> ({taxon_rank})</span>
          <span className={identifierStyle}>
            <span className={identifierPrefixStyle}>taxId:</span>
            {taxon_id}
          </span>
        </div>
      </Tooltip>

      <div>
        <Grid container alignItems="center" direction="column" spacing={1}>
          <Grid style={{ width: "100%" }}>{lineages}</Grid>
          {taxidLink && (
            <>
              <Grid container direction="row" justifyContent="flex-end">
                <Grid>{taxidLink}</Grid>
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
  dispatchLookup,
)(TaxonPanel);
