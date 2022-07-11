import * as htmlToImage from "html-to-image";

import { saveSvgAsPng, svgAsDataUri } from "save-svg-as-png";

import DownloadButton from "./DownloadButton";
import GetAppIcon from "@material-ui/icons/GetApp";
import Grid from "@material-ui/core/Grid";
import React from "react";
import { compose } from "recompose";
import dispatchReport from "../hocs/dispatchReport";
import qs from "../functions/qs";
import withReportById from "../hocs/withReportById";

export const ReportDownload = ({
  reportById,
  report,
  chartRef,
  code,
  saveReport,
  queryString,
}) => {
  if (!reportById.report || !reportById.report[report]) {
    return null;
  }

  const exportChart = async ({ options, format, filename = "report" }) => {
    const downloadLink = async (uri, filename) => {
      const link = document.createElement("a");
      link.href = uri;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    };

    let chartSVG;
    let success = false;
    if (format == "png" || format == "svg") {
      if (chartRef.current && chartRef.current.children) {
        // chartSVG = chartRef.current.childNodes[0].childNodes[0];
        chartSVG = chartRef.current.childNodes[0];
        if (report == "tree" && !queryString.match("=ring")) {
          chartSVG =
            chartRef.current.childNodes[0].childNodes[1].childNodes[0]
              .childNodes[0].childNodes[0].childNodes[0];
        }
      } else {
        return;
      }
      // chartSVG = React.Children.only(chartSVG);
      // let { x: left, y: top, height, width } = chartSVG.viewBox.baseVal;
      // let opts = {
      //   excludeCss: true,
      //   scale: 2,
      //   backgroundColor: "white",
      //   left,
      //   top,
      //   height,
      //   width,
      // };
      let opts = {
        backgroundColor: "white",
      };
      if (format == "png") {
        // await saveSvgAsPng(chartSVG, `${filename}.png`, opts);
        let uri = await htmlToImage.toPng(chartSVG, opts);
        await downloadLink(uri, `${filename}.png`);
        success = true;
      } else if (format == "svg") {
        // let uri = await svgAsDataUri(chartSVG, opts);
        let uri = await htmlToImage.toSvg(chartSVG, opts);
        await downloadLink(uri, `${filename}.svg`);
        success = true;
      }
    } else if (format) {
      success = await saveReport({ options, format });
    }
    return success;
  };

  const handleClick = async ({ options, format }) => {
    let success = false;
    if (format) {
      success = exportChart({ options, format });
    }
    return success;
  };

  let options = {
    PNG: { format: "png" },
    SVG: { format: "svg" },
    JSON: { format: "json" },
    ...(report == "tree" && {
      Newick: { format: "nwk" },
      PhyloXML: { format: "xml" },
      ZIP: { format: "zip" },
    }),
  };

  return (
    <Grid
      container
      direction="column"
      style={{ height: "100%", width: "100%" }}
    >
      <Grid item align="right">
        {/* <GetAppIcon
          onClick={(e) => {
            if (code) {
              exportChart(e, "json");
            } else {
              exportChart();
            }
          }}
          style={{ cursor: "pointer" }}
        /> */}
        <DownloadButton
          onButtonClick={handleClick}
          searchTerm={qs.parse(queryString)}
          options={options}
        />
      </Grid>
    </Grid>
  );
};

export default compose(dispatchReport, withReportById)(ReportDownload);
