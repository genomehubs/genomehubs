import * as htmlToImage from "html-to-image";

import React, { memo, useEffect, useRef, useState } from "react";

import CopyrightIcon from "@mui/icons-material/Copyright";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import PalettePicker from "./PalettePicker";
import PalettePreview from "./PalettePreview";
import { Popover } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import QrCodeIcon from "@mui/icons-material/QrCode";
import Taxonomy from "./Taxonomy";
import Tooltip from "./Tooltip";
import bbsrcLogo from "./img/bbsrc-logo.png";
import { compose } from "redux";
import dispatchRecord from "../hocs/dispatchRecord";
import dispatchTypes from "../hocs/dispatchTypes";
import dtolLogo from "./img/dtol-logo.png";
import { link as linkStyle } from "./Styles.scss";
import qs from "../functions/qs";
import sangerLogo from "./img/sanger-logo.png";
import { saveSearchOptions as saveSearchOptionsStyle } from "./Styles.scss";
import { useLocation } from "@reach/router";
import useNavigate from "../hooks/useNavigate";
import withApi from "../hocs/withApi";
import withColors from "#hocs/withColors";
import withTaxonomy from "../hocs/withTaxonomy";
import withVersion from "../hocs/withVersion";

const Footer = ({
  id,
  version,
  fetchTypes,
  hidden,
  taxonomy,
  apiStatus,
  selectPalette,
  levels,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const qrRef = useRef();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const popupId = open ? "simple-popover" : undefined;
  let options = qs.parse(location.search.replace(/^\?/, ""));
  let currentPalette = options.palette || id;
  const updatePalette = (newPalette) => {
    if (newPalette != currentPalette) {
      options.palette = newPalette;
    }
    if (options.palette == "default") {
      delete options.palette;
    }
    handleClose();
    navigate(`${location.pathname}?${qs.stringify(options)}${location.hash}`);
  };
  useEffect(() => {
    fetchTypes("multi", options.taxonomy || taxonomy);
  }, [taxonomy, apiStatus]);
  useEffect(() => {
    if (currentPalette != id) {
      selectPalette(currentPalette);
    }
  }, [currentPalette, levels]);
  if (!taxonomy || hidden) {
    return <Taxonomy display={false} />;
  }

  let dataRelease;

  if (version.hub) {
    let releaseLink = version.release;
    if (version.source) {
      releaseLink = (
        <a className={linkStyle} href={version.source} target="_blank">
          {releaseLink}
        </a>
      );
    }
    dataRelease = (
      <span style={{ float: "left", marginLeft: "1em" }}>
        {version.hub} data release {releaseLink}
      </span>
    );
  }
  let borderRadius = "15%";
  let swatches = 6;
  let swatchSize = "2em";
  let colors = levels[swatches] || levels.default.slice(0, swatches);
  let palette = (
    <PalettePreview
      colors={colors}
      size={swatchSize}
      borderRadius={borderRadius}
      swatches={swatches}
    />
  );

  let settingsPopup = (
    <Popover
      id={popupId}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
    >
      <PalettePicker
        handleClick={updatePalette}
        borderRadius={borderRadius}
        swatches={swatches}
        size={swatchSize}
      />
    </Popover>
  );

  let reportIssue = (
    <span style={{ float: "right", marginRight: "1em" }}>
      Report an{" "}
      <a
        className={linkStyle}
        href="https://github.com/genomehubs/genomehubs/issues"
        target="_blank"
      >
        issue
      </a>
    </span>
  );

  const qrCodeSize = 512;

  const handleQRClick = async (qrRef) => {
    let opts = {
      backgroundColor: "white",
      width: qrCodeSize,
      height: qrCodeSize,
    };

    let uri = await htmlToImage.toBlob(qrRef, opts);
    let fileURL = URL.createObjectURL(uri);
    window.open(fileURL, "_blank");
  };

  let qrButton;
  if (location.href.length < 2000) {
    qrButton = (
      <Tooltip title="Generate QR Code for page" arrow placement={"top"}>
        <span>
          <IconButton
            className={saveSearchOptionsStyle}
            aria-label="search settings"
            // onClick={() => setOpen(!open)}
            size="large"
            onClick={() => handleQRClick(qrRef.current)}
          >
            <QrCodeIcon style={{ color: "white" }} />
          </IconButton>
          <div style={{ height: 0, display: "none" }}>
            <QRCodeSVG
              ref={qrRef}
              key={"qrcode"}
              value={location.href}
              level={"M"}
              fgColor={"#31323f"}
              marginSize={"4"}
              size={qrCodeSize}
              imageSettings={{
                src: "/android-chrome-192x192.png",
                height: qrCodeSize / 5,
                width: qrCodeSize / 5,
                excavate: true,
              }}
            />
          </div>
        </span>
      </Tooltip>
    );
  } else {
    qrButton = null;
  }

  let poweredBy = (
    // <span style={{ float: "left", marginLeft: "1em" }}>
    <span>
      Powered by{" "}
      <a className={linkStyle} href="https://genomehubs.org/" target="_blank">
        GenomeHubs
      </a>{" "}
      <CopyrightIcon fontSize="inherit" /> {new Date().getFullYear()}
    </span>
  );

  let settings = (
    <span
      style={{ float: "left", marginLeft: "1em", cursor: "pointer" }}
      onClick={handleClick}
    >
      {palette}
    </span>
  );

  let logos = (
    <span style={{ float: "right", marginRight: "0.5em" }}>
      <a href="https://www.sanger.ac.uk/" target="_blank">
        <img src={sangerLogo} />
      </a>
      <a href="https://www.darwintreeoflife.org" target="_blank">
        <img src={dtolLogo} />
      </a>
      <a href="https://bbsrc.ukri.org/" target="_blank">
        <img src={bbsrcLogo} />
      </a>
    </span>
  );

  return (
    <footer>
      <Taxonomy display={false} />
      <Grid container direction="row" spacing={0} style={{ maxHeight: "100%" }}>
        <Grid size={3}>{dataRelease}</Grid>
        <Grid size={6}>{qrButton}</Grid>
        <Grid size={3}>{reportIssue}</Grid>
      </Grid>
      <Grid container direction="row" spacing={0} style={{ maxHeight: "100%" }}>
        <Grid size={4}>
          {settings}
          {settingsPopup}
        </Grid>
        <Grid size={4}>{poweredBy}</Grid>
        <Grid size={4}>{logos}</Grid>
      </Grid>
    </footer>
  );
};

export default compose(
  memo,
  dispatchRecord,
  withVersion,
  withApi,
  withTaxonomy,
  dispatchTypes,
  withColors,
)(Footer);
