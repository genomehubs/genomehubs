import React, { useEffect } from "react";
import {
  header as headerStyle,
  infoPanel1Column as infoPanel1ColumnStyle,
  infoPanel as infoPanelStyle,
  resultPanel as resultPanelStyle,
  title as titleStyle,
} from "./Styles.scss";
import { useLocation, useNavigate } from "@reach/router";

import AssemblySummaryPanel from "./AssemblySummaryPanel";
import Grid from "@mui/material/Grid2";
import { NamesList } from "./NamesPanel";
import classnames from "classnames";
import { compose } from "recompose";
import dispatchLookup from "../hocs/dispatchLookup";
import qs from "../functions/qs";
import withRecord from "../hocs/withRecord";
import withSearch from "../hocs/withSearch";
import withSiteName from "../hocs/withSiteName";

const AssemblyPanel = ({
  recordIsFetching,
  records,
  fetchRecord,
  assemblyId,
  setPreferSearchTerm,
  result,
  taxonomy,
  basename,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  let options = qs.parse(location.search.replace(/^\?/, ""));

  let scientificName, rank;
  let namesDiv;
  if (assemblyId) {
    if (records[assemblyId]) {
      let identifiers = (records[assemblyId].record.identifiers || []).filter(
        (obj) => obj.class != "assembly_id",
      );
      if (result == "assembly" && identifiers.length > 0) {
        namesDiv = <NamesList names={identifiers} />;
      }
      ({
        scientific_name: scientificName,
        lineage,
        taxon_rank: rank,
      } = records[assemblyId].record);
    } else {
    }
  }

  useEffect(() => {
    if (assemblyId && !records[assemblyId] && !recordIsFetching) {
      fetchRecord({
        recordId: assemblyId,
        result: "assembly",
        taxonomy: options.taxonomy || taxonomy || "ncbi",
      });
    }
  }, [assemblyId]);

  const handleAssemblyClick = () => {
    setPreferSearchTerm(false);
    navigate(
      `${basename}/record?recordId=${assemblyId}&result=assembly&taxonomy=${
        options.taxonomy || taxonomy
      }#${encodeURIComponent(assemblyId)}`,
    );
  };

  let css = classnames(infoPanelStyle, infoPanel1ColumnStyle, resultPanelStyle);

  return (
    <>
      <div className={css}>
        <div className={headerStyle} onClick={handleAssemblyClick}>
          <span className={titleStyle}>Assembly — {assemblyId}</span>
        </div>

        <div>
          <Grid container alignItems="center" direction="column" spacing={0}>
            <Grid style={{ width: "100%" }}>
              <AssemblySummaryPanel assemblyId={assemblyId} />
            </Grid>
            <Grid container direction="row">
              <Grid style={{ width: "100%" }} size={12}></Grid>
            </Grid>
          </Grid>
        </div>
      </div>
      {namesDiv && (
        <div className={css}>
          <div className={headerStyle}>
            <span className={titleStyle}>Identifiers</span>
          </div>

          <div>
            <Grid container alignItems="center" direction="column" spacing={0}>
              <Grid style={{ width: "100%" }}>{namesDiv}</Grid>
            </Grid>
          </div>
        </div>
      )}
    </>
  );
};

export default compose(
  withSiteName,
  withSearch,
  withRecord,
  dispatchLookup,
)(AssemblyPanel);
