import React, { useEffect } from "react";
import { useLocation, useNavigate } from "@reach/router";

import Grid from "@material-ui/core/Grid";
import { NamesList } from "./NamesPanel";
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

const AssemblyPanel = ({
  scientific_name,
  recordId,
  recordIsFetching,
  records,
  fetchRecord,
  setRecordId,
  setLookupTerm,
  assemblyId,
  fetchSearchResults,
  setPreferSearchTerm,
  result,
  taxonomy,
  basename,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  let options = qs.parse(location.search.replace(/^\?/, ""));

  let assemblyLink;
  let namesDiv;
  if (assemblyId) {
    if (records[assemblyId]) {
      if (assemblyId.startsWith("GCA_")) {
        let enaUrl = `https://www.ebi.ac.uk/ena/browser/view/${assemblyId}`;
        let ncbiUrl = `https://www.ncbi.nlm.nih.gov/datasets/genome/${assemblyId}/`;
        assemblyLink = (
          <>
            View assembly in{" "}
            <span style={{ textDecoration: "underline" }}>
              <NavLink href={enaUrl}>ENA</NavLink>
            </span>
            <span style={{ textDecoration: "underline" }}>
              <NavLink href={ncbiUrl}>NCBI</NavLink>
            </span>
          </>
        );
      }
      let identifiers = (records[assemblyId].record.identifiers || []).filter(
        (obj) => obj.class != "assembly_id"
      );
      if (identifiers.length > 0) {
        namesDiv = <NamesList names={identifiers} />;
      }
    } else {
    }
  }

  useEffect(() => {
    if (assemblyId && !records[assemblyId] && !recordIsFetching) {
      fetchRecord(
        assemblyId,
        "assembly",
        options.taxonomy || taxonomy || "ncbi"
      );
    }
  }, [assemblyId]);

  const handleAssemblyClick = () => {
    setPreferSearchTerm(false);
    navigate(
      `${basename}/record?recordId=${assemblyId}&result=assembly&taxonomy=${
        options.taxonomy || taxonomy
      }#${encodeURIComponent(assemblyId)}`
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
      <Tooltip
        title={"Click to view full assembly record"}
        arrow
        placement="top"
      >
        <div className={styles.header} onClick={handleAssemblyClick}>
          <span className={styles.title}>Assembly — {assemblyId}</span>
          {/* <span> ({taxon_rank})</span>
          <span className={styles.identifier}>
            <span className={styles.identifierPrefix}>taxId:</span>
            {taxon_id}
          </span> */}
        </div>
      </Tooltip>

      <div>
        <Grid container alignItems="center" direction="column" spacing={0}>
          <Grid item style={{ width: "100%" }}>
            {namesDiv}
          </Grid>
          <Grid container direction="row" justifyContent="flex-end">
            <Grid item>{assemblyLink}</Grid>
          </Grid>
        </Grid>
        {/* <div className={styles.flexRow}>{fieldDivs}</div>
        {additionalDivs.length > 0 && (
          <div className={styles.flexRow}>{additionalDivs}</div>
        )} */}
      </div>
    </div>
  );
};

export default compose(
  withSiteName,
  withSearch,
  withRecord,
  dispatchLookup
)(AssemblyPanel);
