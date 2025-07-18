import * as htmlToImage from "html-to-image";

import React, { useRef, useState } from "react";
import {
  favListingButton as favListingButtonStyle,
  favListingContainer as favListingContainerStyle,
  favListingContent as favListingContentStyle,
  favListingExpand as favListingExpandStyle,
  favListingHeader as favListingHeaderStyle,
  favListing as favListingStyle,
} from "./Styles.scss";
import { useLocation, useNavigate } from "@reach/router";

import ColorButton from "./ColorButton";
import EditIcon from "@mui/icons-material/Edit";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FavouriteButton from "./FavouriteButton";
import MuiDialogContent from "@mui/material/DialogContent";
import { QRCodeSVG } from "qrcode.react";
import QrCodeIcon from "@mui/icons-material/QrCode";
import SearchIcon from "@mui/icons-material/Search";
import Typography from "@mui/material/Typography";
import YamlEditor from "@focus-reactive/react-yaml";
import { compose } from "recompose";
import { downloadLink } from "./ReportDownload";
import makeStyles from "@mui/styles/makeStyles";
import qs from "../functions/qs";
import { splitTerms } from "../functions/splitTerms";
import { useLocalStorage } from "usehooks-ts";
import withSearchDefaults from "../hocs/withSearchDefaults";
import withSiteName from "#hocs/withSiteName";
import withStyles from "@mui/styles/withStyles";
import withTaxonomy from "../hocs/withTaxonomy";

export const useStyles = makeStyles((theme) => ({
  paper: {
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

const SaveSettingsFavourites = ({ currentIndex, basename, taxonomy }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expand, setExpand] = useState({});
  const [remove, setRemove] = useState({});
  const [edit, setEdit] = useState({});
  const qrRef = useRef();
  // const [changed, setChanged] = useState({});
  let changed = {};
  const [favourites, setFavourites] = useLocalStorage(
    `${currentIndex}Favourites`,
    {},
  );
  const [currentFavourites, setCurrentFavourites] = useState(favourites);

  const DialogContent = withStyles((theme) => ({
    root: {
      padding: "16px",
    },
  }))(MuiDialogContent);

  let favListings = [];

  const handleChange = ({ json, key }) => {
    changed[key] = json;
  };

  const qrCodeSize = 512;

  const handleSave = () => {
    let newFavourites = { ...currentFavourites };
    Object.keys(changed).forEach((key) => {
      let { name = true, ...rest } = changed[key];
      newFavourites[JSON.stringify(rest)] = name;
      delete newFavourites[key];
    });
    for (let key in remove) {
      delete newFavourites[key];
    }
    setFavourites(newFavourites);
  };

  const toggleEdit = (key) => {
    if (edit[key] && changed[key]) {
      let newFavourites = { ...currentFavourites };
      delete newFavourites[key];
      let { name = true, ...rest } = changed[key];
      newFavourites[JSON.stringify(rest)] = name;
      setCurrentFavourites(newFavourites);
      delete changed[key];
    }
    setEdit({ ...edit, [key]: !edit[key] });
  };

  const handleExpand = (key) => {
    setExpand({ ...expand, [key]: !expand[key] });
  };

  const handleQRClick = async (chartSVG, filename, toUrl = false) => {
    let opts = {
      backgroundColor: "white",
      width: qrCodeSize,
      height: qrCodeSize,
    };
    if (toUrl) {
      let uri = await htmlToImage.toBlob(chartSVG, opts);
      let fileURL = URL.createObjectURL(uri);
      window.open(fileURL, "_blank");
      return;
    }
    let uri = await htmlToImage.toPng(chartSVG, opts);
    await downloadLink(uri, `${filename}.png`);
  };

  const formatYaml = ({ searchTerm, reportTerm }) => {
    let arr = Object.entries(searchTerm || {}).map(([key, value]) => (
      <pre key={key} className={favListingStyle}>
        <b>{key}:</b> {JSON.stringify(value)}
      </pre>
    ));
    if (reportTerm && Object.keys(reportTerm).length > 0) {
      arr.push(<hr key={"hr"} />);
      arr = arr.concat(
        Object.entries(reportTerm || {}).map(([key, value]) => (
          <pre key={key} className={favListingStyle}>
            <b>{key}:</b> {JSON.stringify(value)}
          </pre>
        )),
      );
    }
    return arr;
  };

  Object.keys(currentFavourites).forEach((key, i) => {
    // let searchTerm = JSON.parse(key);
    let { searchTerm, reportTerm } = splitTerms(JSON.parse(key));
    let name =
      currentFavourites[key] === true
        ? searchTerm.query
        : currentFavourites[key];

    let favButton = (
      <FavouriteButton
        isFavourite={!remove[key]}
        handleClickFavourite={(e) => {
          e.stopPropagation();
          setRemove({ ...remove, [key]: !remove[key] });
        }}
        name={name}
      />
    );

    let qrLink = `${location.origin}${basename}/search?${encodeURIComponent(qs.stringify({ taxonomy, ...searchTerm, ...reportTerm }))}#${encodeURIComponent(searchTerm.query)}`;
    favListings.push(
      <div key={i} className={favListingStyle}>
        <div className={favListingContainerStyle}>
          <div
            className={favListingHeaderStyle}
            onClick={() => handleExpand(key)}
          >
            {favButton}
            <span className={favListingExpandStyle}>
              {expand[key] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </span>
            <Typography>
              <span
                style={{
                  marginRight: "1.5em",
                }}
              >
                {name}
              </span>
            </Typography>
          </div>
          {expand[key] && (
            <div className={favListingContentStyle}>
              {edit[key] ? (
                <YamlEditor
                  json={{
                    name,
                    ...searchTerm,
                    ...reportTerm,
                  }}
                  onChange={({ json }) => handleChange({ json, key })}
                />
              ) : (
                formatYaml({ searchTerm, reportTerm })
              )}
              <div className={favListingButtonStyle}>
                <ColorButton
                  autoFocus
                  color="primary"
                  // variant="outlined"
                  startIcon={<QrCodeIcon />}
                  onClick={() => handleQRClick(qrRef.current, "link", true)}
                >
                  QR Code
                </ColorButton>
                <ColorButton
                  autoFocus
                  color="primary"
                  // variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => toggleEdit(key)}
                >
                  Edit
                </ColorButton>
                <ColorButton
                  autoFocus
                  color="primary"
                  // variant="outlined"
                  startIcon={<SearchIcon />}
                  onClick={() => {
                    let { name, ...rest } = JSON.parse(key);
                    navigate(
                      `/search?${qs.stringify({
                        // ...searchDefaults,
                        taxonomy,
                        ...rest,
                      })}`,
                    );
                  }}
                >
                  Search
                </ColorButton>
              </div>
              <div style={{ height: 0, display: "none" }}>
                <QRCodeSVG
                  ref={qrRef}
                  key={"qrcode"}
                  value={qrLink}
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
            </div>
          )}
        </div>
      </div>,
    );
  });
  if (favListings.length === 0) {
    favListings = (
      <Typography key="no-favourites">
        You do not have any favourite searches for the {currentIndex} index.
        <br />
        To add a favourite, click the heart icon above the search results table.
      </Typography>
    );
  } else if (
    Object.keys(remove).length > 0 ||
    Object.keys(changed).length > 0 ||
    JSON.stringify(favourites) != JSON.stringify(currentFavourites)
  ) {
    favListings.push(
      <div
        key={"save-changes"}
        style={{ position: "relative", height: "2em", width: "100%" }}
      >
        <ColorButton
          className={favListingButtonStyle}
          autoFocus
          onClick={handleSave}
          color="primary"
        >
          Save changes
        </ColorButton>
      </div>,
    );
  }

  return <DialogContent dividers>{favListings}</DialogContent>;
};

export default compose(
  withTaxonomy,
  withSiteName,
  withSearchDefaults,
)(SaveSettingsFavourites);
