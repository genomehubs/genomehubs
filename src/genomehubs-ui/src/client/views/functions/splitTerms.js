const reportParams = {
  report: false,
  y: false,
  z: false,
  cat: false,
  pointSize: 15,
  rank: false,
  stacked: false,
  yScale: "linear",
  cumulative: false,
  compactLegend: false,
  catToX: false,
};

const searchParams = {
  query: false,
  result: false,
  includeEstimates: "false",
  summaryValues: "count",
  taxonomy: "ncbi",
  size: 10,
  offset: 0,
  fields: "",
  names: "",
  ranks: "",
};

export const splitTerms = (terms) => {
  let searchTerm = {};
  let reportTerm = {};
  for (let key in terms) {
    if (reportParams[key] !== undefined) {
      if (reportParams[key] === false || reportParams[key] != terms[key]) {
        reportTerm[key] = terms[key];
      }
    } else if (searchParams.hasOwnProperty(key)) {
      if (searchParams[key] != terms[key]) {
        searchTerm[key] = terms[key];
      }
    } else {
      searchTerm[key] = terms[key];
    }
  }
  return { searchTerm, reportTerm: reportTerm.report ? reportTerm : undefined };
};
