import Grid from "@mui/material/Grid";
import Tooltip from "./Tooltip";
import { compose } from "redux";
import withColors from "#hocs/withColors";

const AggregationIcon = ({
  method,
  rank,
  hasDescendants,
  statusColors = {},
}) => {
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
    ancestor: rank
      ? `Estimated value based on ${rank}`
      : "Estimated value inferred from ancestral taxa",
  };
  const column = (method, append) => {
    let borderRadius = "0.17em";
    if (append) {
      borderRadius = "0 0.17em 0.17em 0";
    } else if (hasDescendants) {
      borderRadius = "0.17em 0 0 0.17em";
    }
    return (
      <span style={{ width: "0.34em", display: "inline-block" }}>
        <Grid
          style={{
            minHeight: "1.02em",
            minWidth: "0.34em",
            maxWidth: "0.34em",
            boxSizing: "border-box",
            border: `0.08em solid ${colors[method]}`,
            borderRadius: borderRadius,
            overflow: "hidden",
            ...(append && { borderLeft: "none" }),
          }}
          container
          spacing={0}
          direction="column"
        >
          <Grid
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
};

export default compose(withColors)(AggregationIcon);
