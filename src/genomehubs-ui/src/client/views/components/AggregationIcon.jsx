import Grid from "@material-ui/core/Grid";
import React from "react";
import Tooltip from "./Tooltip";
import { compose } from "recompose";
import withColors from "../hocs/withColors";

const AggregationIcon = ({ method, hasDescendants, statusColors = {} }) => {
  const colors = {
    direct: statusColors.direct || "green",
    descendant: statusColors.descendant || "orange",
    ancestor: statusColors.ancestral || "red",
  };
  const heights = {
    direct: 1.02,
    descendant: 0.68,
    ancestor: 0.34,
  };
  const tooltips = {
    direct: "Directly recorded or assigned value",
    descendant: "Estimated value inferred from descendant taxa",
    ancestor: "Estimated value inferred from ancestral taxa",
  };
  const column = (method, append) => {
    return (
      <span style={{ width: "0.34em", display: "inline-block" }}>
        <Grid
          style={{
            minHeight: "1.02em",
            minWidth: "0.34em",
            maxWidth: "0.34em",
            boxSizing: "border-box",
            border: `0.08em solid ${colors[method]}`,
            ...(append && { borderLeft: "none" }),
          }}
          container
          spacing={0}
          direction="column"
        >
          <Grid
            item
            xs={1}
            style={{
              backgroundColor: colors[method],
              minHeight: `${heights[method]}em`,
              minWidth: "0.34em",
              maxWidth: "0.34em",
              margin: "-0.08em",
              ...(append && { marginLeft: 0 }),
              marginTop: `${0.97 - heights[method]}em`,
            }}
          ></Grid>
        </Grid>
      </span>
    );
  };
  return (
    <Tooltip title={tooltips[method] || ""} arrow placement={"top"}>
      <span style={{ whiteSpace: "nowrap" }}>
        {column(method)}
        {hasDescendants && column("descendant", true)}
      </span>
    </Tooltip>
  );
  {
    /* <div className={styles.confidence}>
      <div className={classnames(styles.one, styles[`one${level}`])}></div>
      <div className={classnames(styles.two, styles[`two${level}`])}></div>
      <div className={classnames(styles.three, styles[`three${level}`])}></div>
    </div> */
  }
};

export default compose(withColors)(AggregationIcon);
