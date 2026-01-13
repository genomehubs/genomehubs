import CancelIcon from "@mui/icons-material/Cancel";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import React from "react";
import Select from "@mui/material/Select";
import SettingsButton from "./SettingsButton";
import { TextField } from "@mui/material";
import { compose } from "redux";
import expandFieldList from "#functions/expandFieldList";
import makeStyles from "@mui/styles/makeStyles";
import qs from "#functions/qs";
import { styled } from "@mui/material/styles";
import { useLocation } from "@reach/router";
import useNavigate from "#hooks/useNavigate";
import withRecord from "#hocs/withRecord";
import withSearch from "#hocs/withSearch";
import withSiteName from "#hocs/withSiteName";
import withTypes from "#hocs/withTypes";

const useStyles = makeStyles((theme) => ({
  paper: {
    width: "95%",
    minWidth: "600px",
    minHeight: "200px",
    padding: "8px",
    marginTop: "8px",
    border: "none",
    boxShadow: "none",
    overflowX: "hidden",
  },
  root: {
    width: "100%",
  },
  selectEmpty: {
    marginTop: "16px",
  },
  redBackground: {
    backgroundColor: "#C00",
    padding: "10px",
  },
  whiteBackground: {
    backgroundColor: "#FFF",
  },
  formControl: {
    margin: "8px",
    minWidth: "240px",
    maxWidth: "480px",
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
  },
  chip: {
    margin: "2px",
    backgroundColor: "#FFF",
  },
  noLabel: {
    marginTop: "24px",
  },
  label: {
    color: "#ff7001",
  },
}));

const summaryTypesFromMeta = (meta) => {
  let summaryTypes = ["value"];
  // if (meta) {
  //   summaryTypes.push()
  // }
  if (meta?.summary) {
    let skip = true;
    let summaries = meta.summary;
    if (!Array.isArray(summaries)) {
      summaries = [summaries];
    }
    for (let summary of summaries) {
      if (summary == "primary") {
        continue;
      }
      if (summary.endsWith("list")) {
        summaryTypes.push("length");
      }
      if (skip) {
        skip = false;
        continue;
      }
      summaryTypes.push(summary);
    }
  }
  if (meta?.traverse) {
    summaryTypes.push("direct");
    if (meta.traverse_direction && meta.traverse_direction == "up") {
      summaryTypes.push("descendant");
    } else if (meta.traverse_direction && meta.traverse_direction == "down") {
      summaryTypes.push("ancestor");
    } else {
      summaryTypes.push("ancestor");
      summaryTypes.push("descendant");
      summaryTypes.push("estimate");
    }
  }
  return summaryTypes;
};

const MyInputLabel = styled(InputLabel)({
  color: "green",
  backgroundColor: "aliceblue",
});

const ResultColumnOptions = ({
  attributeId,
  types,
  setAttributeSettings,
  resetRecord,
  setPreferSearchTerm,
  searchTerm,
  basename,
}) => {
  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const summaryTypes = summaryTypesFromMeta(types[attributeId]) || [];
  const initialSelected = searchTerm.fields
    ? searchTerm.fields
        .split(",")
        .map((field) => field.split(":"))
        .filter(([f]) => f == attributeId)
        .map(([name, subset = types[attributeId].processed_simple]) => subset)
    : ["value"];
  const [summaryCols, setSummaryCols] = React.useState(initialSelected);
  let initialFieldOpts =
    searchTerm?.fieldOpts?.find((f) => f.startsWith(attributeId)) || ";;";
  initialFieldOpts = initialFieldOpts.replace(`${attributeId}:`, "");
  const [fieldOpts, setFieldOpts] = React.useState(initialFieldOpts);

  const handleChange = (e) => {
    setSummaryCols(e.target.value);
  };

  const handleOptsChange = (e) => {
    setFieldOpts(e.target.value);
  };

  const handleDelete = (e, value) => {
    e.preventDefault();
    setSummaryCols(summaryCols.filter((entry) => entry !== value));
  };

  const handleClick = () => {
    let newFields = summaryCols.map((summary) => {
      let processed_simple = types[attributeId].processed_simple || "value";
      return summary == processed_simple
        ? attributeId
        : `${attributeId}:${summary}`;
    });
    let fields = [];
    if (searchTerm.fields) {
      fields = expandFieldList({ fields: searchTerm.fields, types });
    } else {
      fields = Object.entries(types)
        .filter(
          ([_, v]) => v.group == searchTerm.result && v.display_level == 1,
        )
        .map(([k]) => k);
    }

    let index = fields.findIndex(
      (f) => f == attributeId || f.startsWith(`${attributeId}:`),
    );
    fields = fields.filter(
      (f) => f != attributeId && !f.startsWith(`${attributeId}:`),
    );
    fields.splice(index, 0, ...newFields);
    let newFieldOpts = (searchTerm.fieldOpts || []).filter((entry) => {
      return !entry.startsWith(`${attributeId}:`);
    });
    if (fieldOpts && !fieldOpts.match("^[,;]*$")) {
      newFieldOpts.push(`${attributeId}:${fieldOpts}`);
    }

    let options = {
      ...searchTerm,
      // result: index,
      offset: 0,
      fields: fields.length > 0 ? fields.join(",") : "none",
      fieldOpts: newFieldOpts,

      // names: names.join(","),
      // ranks: ranks.join(","),
      // taxonomy: state.taxonomy,
    };
    setPreferSearchTerm(false);
    navigate(`search?${qs.stringify(options)}${location.hash || ""}`);
    setAttributeSettings({
      attributeId: undefined,
      showAttribute: false,
    });
    resetRecord();
  };

  const handleResetClick = () => {
    let options = {
      ...searchTerm,
      // taxonomy,
      offset: 0,
      fields: attributeId,
    };
    setPreferSearchTerm(false);
    navigate(`search?${qs.stringify(options)}${location.hash || ""}`);
  };

  let form = (
    <div>
      <FormControl variant="standard" className={classes.formControl}>
        <MyInputLabel
          id="subset-checkbox-label"
          sx={{
            color: "red",
            "&.Mui-focused": { color: "green" },
            "&.MuiInputLabel-shrink": {
              color: "red",
            },
            "&.MuiInputLabel-root": {
              color: "blue",
            },
          }}
        >
          Subset
        </MyInputLabel>
        <Select
          variant="standard"
          labelId="subset-checkbox-label"
          id="subset-checkbox"
          sx={{
            "& .MuiInput-root": {
              color: "#000",
              fontFamily: "Arial",
              fontWeight: "bold",
              // Bottom border
              "&:before": {
                borderColor: "#2e2e2e",
                borderWidth: "2px",
              },
            },
            // Label
            "& .MuiInputLabel-root": {
              color: "#2e2e2e",
              fontWeight: "bold",
            },
          }}
          multiple
          value={summaryCols}
          onChange={handleChange}
          IconComponent={KeyboardArrowDownIcon}
          renderValue={(selected) => (
            <div className={classes.chips}>
              {selected.map((value) => (
                <Chip
                  key={value}
                  label={value}
                  clickable
                  deleteIcon={
                    <CancelIcon
                      onMouseDown={(event) => event.stopPropagation()}
                    />
                  }
                  className={classes.chip}
                  onDelete={(e) => handleDelete(e, value)}
                />
              ))}
            </div>
          )}
        >
          {summaryTypes.map((summary) => (
            <MenuItem key={summary} value={summary}>
              <Checkbox
                color={"default"}
                checked={summaryCols.includes(summary)}
              />
              <ListItemText primary={summary} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl variant="standard" className={classes.formControl}>
        <TextField
          label={"fieldOpts"}
          id="fieldopts-textbox"
          value={fieldOpts}
          onChange={handleOptsChange}
          variant="outlined"
          helperText="Enter field options"
        />
      </FormControl>
    </div>
  );
  return (
    <Paper className={classes.paper}>
      <Grid container alignItems="center" direction="column" spacing={2}>
        <Grid container direction="row">
          <Grid>{form}</Grid>
        </Grid>
        <Grid container alignItems="flex-end" direction="row" spacing={2}>
          <SettingsButton
            handleClick={handleClick}
            handleResetClick={handleResetClick}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default compose(
  withSiteName,
  withTypes,
  withRecord,
  withSearch,
)(ResultColumnOptions);
