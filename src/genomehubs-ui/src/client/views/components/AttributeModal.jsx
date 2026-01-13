import React, { useEffect, useState } from "react";

import AttributePanel from "./AttributePanel";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import ResultColumnOptions from "./ResultColumnOptions";
import { compose } from "redux";
import makeStyles from "@mui/styles/makeStyles";
import qs from "#functions/qs";
import withRecord from "#hocs/withRecord";
import withTaxonomy from "#hocs/withTaxonomy";

export const useStyles = makeStyles((theme) => ({
  paper: {
    width: "96%",
    minWidth: "600px",
    padding: "16px",
    marginTop: "16px",
    boxShadow: "none",
  },
  formControl: {
    margin: "16px",
    minWidth: "120px",
  },
  selectEmpty: {
    marginTop: "16px",
  },
  label: {
    color: "rgba(0, 0, 0, 0.54)",
  },
}));

const AttributeModal = ({
  currentRecordId,
  attributeId,
  record,
  recordId,
  fetchRecord,
  recordIsFetching,
  setRecordId,
  taxonomy,
  types,
  displayTypes,
  searchTerm,
}) => {
  const classes = useStyles();
  let options = qs.parse(location.search.replace(/^\?/, ""));
  let title = [];
  useEffect(() => {
    if (currentRecordId && currentRecordId != recordId) {
      setRecordId(currentRecordId);
    } else if (recordId) {
      if (
        (!options.result || options.result == "taxon") &&
        (!record.record || recordId != record.record.taxon_id)
      ) {
        if (!recordIsFetching) {
          fetchRecord({ recordId, result: "taxon", taxonomy });
        }
      } else if (
        options.result == "assembly" &&
        (!record.record || recordId != record.record.assembly_id)
      ) {
        if (!recordIsFetching) {
          fetchRecord({ recordId, result: "assembly", taxonomy });
        }
      } else if (
        options.result == "sample" &&
        (!record.record || recordId != record.record.sample_id)
      ) {
        if (!recordIsFetching) {
          fetchRecord({ recordId, result: "sample", taxonomy });
        }
      } else if (
        options.result == "feature" &&
        (!record.record || recordId != record.record.feature_id) &&
        !recordIsFetching
      ) {
        fetchRecord({ recordId, result: "feature", taxonomy });
      }
    }
  }, [options, recordId]);

  if (!record.record || record.record.record_id == "none") {
    return <ResultColumnOptions attributeId={attributeId} />;
  }
  if (record.record.feature_id) {
    title.unshift(record.record.feature_id);
  }
  if (record.record.assembly_id) {
    title.unshift(record.record.feature_id);
  }
  if (record.record.taxon_id) {
    if (record.record.scientific_name) {
      title.unshift(
        `${record.record.scientific_name} (${record.record.taxon_id})`,
      );
    } else {
      title.unshift(`Taxon ID ${record.record.taxon_id}`);
    }
  }

  let table;
  let prefix = attributeId.replace(/:.+$/, "");
  if (record?.record?.attributes && record.record.attributes[prefix]) {
    table = (
      <AttributePanel
        key={"attributes"}
        attributes={{ [prefix]: record.record.attributes[prefix] }}
        result={options.result}
        taxonId={currentRecordId}
        title={title.join(" - ")}
      />
    );
  } else if (record?.record?.taxon_names) {
    let list = record.record.taxon_names
      .filter((obj) => obj.class == prefix)
      .map((obj) => obj.name.replace(",", " ").replace(/\s+/, " "));
    table = (
      <AttributePanel
        key={"attributes"}
        attributes={{ [prefix]: { value: list } }}
        result={options.result}
        taxonId={currentRecordId}
        title={title.join(" - ")}
      />
    );
  } else if (record?.record?.identifiers && record.record.identifiers[prefix]) {
    let list = record.record.identifiers
      .filter((obj) => obj.class == prefix)
      .map((obj) => obj.name);
    table = (
      <AttributePanel
        key={"attributes"}
        attributes={{ [prefix]: { value: list } }}
        result={options.result}
        taxonId={currentRecordId}
        title={title.join(" - ")}
      />
    );
  } else {
    table = (
      <AttributePanel
        key={"attributes"}
        attributes={{ [prefix]: { value: ["No data available"] } }}
        result={options.result}
        taxonId={currentRecordId}
        title={title.join(" - ")}
      />
    );
  }

  return (
    <Paper className={classes.paper}>
      <Grid container alignItems="center" direction="column" spacing={2}>
        <Grid container direction="row">
          {table}
        </Grid>
        <Grid container alignItems="center" direction="row" spacing={2}></Grid>
      </Grid>
    </Paper>
  );
};

export default compose(withTaxonomy, withRecord)(AttributeModal);
