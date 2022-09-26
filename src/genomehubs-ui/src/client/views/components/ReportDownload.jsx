import * as htmlToImage from "html-to-image";

import { saveSvgAsPng, svgAsDataUri } from "save-svg-as-png";

import { Buffer } from "buffer";
import DownloadButton from "./DownloadButton";
import GetAppIcon from "@material-ui/icons/GetApp";
import Grid from "@material-ui/core/Grid";
import JSZip from "jszip";
import React from "react";
import { compose } from "recompose";
import dispatchReport from "../hocs/dispatchReport";
import mergeImages from "merge-images";
import qs from "../functions/qs";
import { queryPropList } from "./ReportEdit";
import { useLocation } from "@reach/router";
import withReportById from "../hocs/withReportById";

const downloadLink = async (uri, filename) => {
  const link = document.createElement("a");
  link.href = uri;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
};

const scrollingImage = async ({
  offset = 500,
  chartHeight,
  imageHeight,
  divHeight,
  scrollContainer,
  chartSVG,
}) => {
  let opts = {
    backgroundColor: "white",
  };
  let images = [];
  let width = chartSVG.clientWidth * window.devicePixelRatio;
  imageHeight = imageHeight || chartHeight;
  for (
    let top = offset;
    top <= offset + imageHeight - divHeight;
    top += divHeight
  ) {
    scrollContainer.scrollTop = top;
    let diff = top - scrollContainer.scrollTop;
    await new Promise((resolve) => setTimeout(resolve, 500));
    let src = await htmlToImage.toPng(chartSVG, opts);
    images.push({
      src,
      x: 0,
      y: (top - offset - diff) * window.devicePixelRatio,
    });
  }

  return mergeImages(images, {
    width,
    height: imageHeight * window.devicePixelRatio,
  });
};

const scrollingDownload = async ({ chartSVG, scrollContainer, filename }) => {
  let divHeight = scrollContainer.clientHeight;
  let chartHeight = scrollContainer.childNodes[0].clientHeight + 10;

  if (chartHeight > 15000) {
    let imageHeight = 10000;
    const zip = new JSZip();
    const folder = zip.folder(filename);
    let index = 1;
    for (
      let offset = 500;
      offset <= chartHeight + 500 - divHeight;
      offset += imageHeight
    ) {
      if (offset + imageHeight - 500 > chartHeight) {
        imageHeight = chartHeight - offset + 500;
      }
      let uri = await scrollingImage({
        chartHeight,
        offset,
        imageHeight,
        divHeight,
        scrollContainer,
        chartSVG,
      });
      let idx = uri.indexOf("base64,") + "base64,".length;
      let content = uri.substring(idx);

      folder.file(`${filename}-${index}.png`, content, { base64: true });
      index += 1;
    }
    let b64 = await zip.generateAsync({ type: "base64" });
    let dataUri = `data:application/zip;base64,${b64}`;
    await downloadLink(dataUri, `${filename}.zip`);
  } else {
    let b64 = await scrollingImage({
      chartHeight,
      divHeight,
      scrollContainer,
      chartSVG,
    });
    await downloadLink(b64, `${filename}.png`);
  }
};

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

  const location = useLocation();

  const exportChart = async ({
    options,
    format,
    filename = "report",
    toUrl,
  }) => {
    let chartSVG;
    let scrollContainer;
    let success = false;
    if (format == "png" || format == "svg") {
      if (chartRef.current && chartRef.current.children) {
        // chartSVG = chartRef.current.childNodes[0].childNodes[0];
        chartSVG = chartRef.current.childNodes[0];
        if (report == "tree" && !queryString.match("=ring")) {
          if (chartSVG.childNodes.length == 1) {
            chartSVG =
              chartSVG.childNodes[0].childNodes[0].childNodes[0].childNodes[0]
                .childNodes[0];
          } else {
            scrollContainer = chartSVG.childNodes[1];
            chartSVG =
              chartSVG.childNodes[1].childNodes[0].childNodes[0].childNodes[0]
                .childNodes[0];
          }
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
        // let uri = await htmlToImage.toPng(chartSVG, opts);
        if (scrollContainer) {
          if (toUrl) return;
          await scrollingDownload({
            chartSVG,
            scrollContainer,
            filename,
          });
        } else {
          let uri = await htmlToImage.toPng(chartSVG, opts);
          if (toUrl) return uri;
          await downloadLink(uri, `${filename}.png`);
        }
        success = true;
      } else if (format == "svg") {
        // let uri = await svgAsDataUri(chartSVG, opts);
        let uri = await htmlToImage.toSvg(chartSVG, opts);
        await downloadLink(uri, `${filename}.svg`);
        success = true;
      }
    } else if (format == "md") {
      let propString = queryPropList[options.report]
        .map((entry) => (typeof entry === "string" ? entry : entry.prop))
        .filter((key) => options.hasOwnProperty(key))
        .map((key) => `${key}="${options[key]}"`)
        .join(" ");
      let text = [
        "# Report",
        "",
        `Exported from [${location.origin}${location.pathname}](${location.href})`,
        "",
        "## Embed in UI",
        "```",
        `::report{${propString}}`,
        "```",
        "",
        "Notes:",
        "- use `xs=` to control width if placing in a grid",
        "- use `ratio=` to adjust width/height ratio",
        "- use `pointSize=` to set font/point size",
      ];

      let imageUrl = await exportChart({
        options,
        format: "png",
        toUrl: true,
      });
      if (imageUrl) {
        text = text.concat([
          "",
          "## Preview",
          "",
          `![Report image](${imageUrl})`,
        ]);
      }
      await downloadLink(
        `data:text/markdown;charset=UTF-8;base64,${new Buffer(
          text.join("\n")
        ).toString("base64")}`,
        `${filename}.md`
      );
      success = true;
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
    MD: { format: "md" },
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
