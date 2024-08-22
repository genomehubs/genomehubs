import React, { useState } from "react";

import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { compose } from "recompose";
import withReportTerm from "../hocs/withReportTerm";

export const ReportSelect = ({ reportSelect, setReportSelect }) => {
  const handleChange = (event, value) => {
    setReportSelect(value || event.target.value);
  };

  let options = (
    <Grid item style={{ width: "100%" }}>
      <FormControl variant="standard" component="fieldset">
        <FormLabel component="legend">Select Mode</FormLabel>
        <RadioGroup
          aria-label="select-mode"
          name="selectMode"
          value={reportSelect}
          onChange={handleChange}
        >
          <FormControlLabel
            value="bin"
            control={<Radio color="default" />}
            label="Bin"
            onClick={() => handleChange(null, "bin")}
          />
          <FormControlLabel
            value="point"
            control={<Radio color="default" />}
            label="Point"
            onClick={() => handleChange(null, "point")}
          />
        </RadioGroup>
      </FormControl>
    </Grid>
  );

  return (
    <Grid
      container
      direction="column"
      style={{ height: "100%", width: "100%" }}
      spacing={2}
    >
      <Grid item style={{ width: "100%" }}>
        Update selection settings:
      </Grid>
      {options}
    </Grid>
  );
};

export default compose(withReportTerm)(ReportSelect);
