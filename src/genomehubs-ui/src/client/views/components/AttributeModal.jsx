import React, { useEffect, useState } from "react";

import AttributePanel from "./AttributePanel";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import ResultColumnOptions from "./ResultColumnOptions";
import { compose } from "recompose";
import { makeStyles } from "@material-ui/core/styles";
import qs from "../functions/qs";
import withRecord from "../hocs/withRecord";
import withTaxonomy from "../hocs/withTaxonomy";

export const useStyles = makeStyles((theme) => ({
  paper: {
    width: "96%",
    minWidth: "600px",
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    boxShadow: "none",
  },
  formControl: {
    margin: theme.spacing(2),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
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
          fetchRecord(recordId, "taxon", taxonomy);
        }
      } else if (
        options.result == "assembly" &&
        (!record.record || recordId != record.record.assembly_id)
      ) {
        if (!recordIsFetching) {
          fetchRecord(recordId, "assembly", taxonomy);
        }
      } else if (
        options.result == "sample" &&
        (!record.record || recordId != record.record.sample_id)
      ) {
        if (!recordIsFetching) {
          fetchRecord(recordId, "sample", taxonomy);
        }
      } else if (
        options.result == "feature" &&
        (!record.record || recordId != record.record.feature_id)
      ) {
        if (!recordIsFetching) {
          fetchRecord(recordId, "feature", taxonomy);
        }
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
        `${record.record.scientific_name} (${record.record.taxon_id})`
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
