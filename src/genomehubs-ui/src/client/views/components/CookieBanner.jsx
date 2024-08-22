import React, { Fragment, useLayoutEffect, useRef, useState } from "react";
import { useCookies, withCookies } from "react-cookie";

import { Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Logo from "./Logo";
import Modal from "@mui/material/Modal";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { compose } from "recompose";
import makeStyles from "@mui/styles/makeStyles";
import styles from "./Styles.scss";
import useWindowDimensions from "../hooks/useWindowDimensions";

const showBanner = COOKIE_BANNER == "true";

function getModalStyle() {
  return {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };
}

const useStyles = makeStyles((theme) => ({
  paper: {
    position: "absolute",
    backgroundColor: "white",
    border: "none",
    boxShadow: "none",
    padding: "10px",
    overflow: "visible",
    "&:focus": {
      outline: "none",
    },
  },
  img: {},
}));

const modalContent = ({
  meta,
  apiUrl,
  windowDimensions,
  previewDimensions,
  setPreviewDimensions,
}) => {
  const [src, setSrc] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleLoad = () => {
    setLoading(false);
  };
  const handleError = () => {
    if (loading != "retry") {
      if (meta.size_pixels && meta.url) {
        setSrc(meta.url);
      }
      setLoading("retry");
    } else {
      setLoading("error");
      console.log("failed to load image");
    }
  };
  //   if (meta.size_pixels) {
  //     if (!src) {
  //       let [width, height] = meta.size_pixels.split("x");
  //       let ratio = height / width;
  //       let modalWidth = windowDimensions.width * 0.6;
  //       let modalHeight = windowDimensions.height * 0.6;
  //       if (width / height > modalWidth / modalHeight) {
  //         let imgWidth = Math.min(width, modalWidth);
  //         setPreviewDimensions({ width: imgWidth, height: imgWidth * ratio });
  //       } else {
  //         let imgHeight = Math.min(height, modalHeight);
  //         setPreviewDimensions({ width: imgHeight / ratio, height: imgHeight });
  //       }

  //       setSrc(`${apiUrl}/download?recordId=${meta.file_id}&streamFile=true`);
  //     }

  //     return loading ? (
  //       <Fragment>
  //         <img
  //           onError={handleError}
  //           onLoad={handleLoad}
  //           style={{ display: "none" }}
  //           src={src}
  //         />
  //         <Skeleton
  //           variant="rect"
  //           width={previewDimensions.width}
  //           height={previewDimensions.height}
  //         />
  //       </Fragment>
  //     ) : (
  //       <img
  //         src={src}
  //         style={{
  //           width: `${previewDimensions.width}px`,
  //           height: `${previewDimensions.height}px`,
  //         }}
  //       />
  //     );
  //   }
  return "test2";
};

export const CookieBanner = ({ meta, apiUrl, link, children }) => {
  const classes = useStyles();
  const [cookies, setCookie, removeCookie] = useCookies(["cookieConsent"]);
  // getModalStyle is not a pure function, we roll the style only on the first render
  const [modalStyle] = React.useState(getModalStyle);
  const [open, setOpen] = React.useState(false);
  const windowDimensions = useWindowDimensions();
  const [previewDimensions, setPreviewDimensions] = useState(false);
  if (!showBanner) {
    return null;
  }

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  };

  let height = previewDimensions.height + 120;
  let width = previewDimensions.width + 20;

  const body = (
    <Grid
      container
      direction="column"
      style={{ ...modalStyle, height, width }}
      className={classes.paper}
    >
      <Grid item xs style={{ width: previewDimensions.width }}>
        <Grid container direction="row" justifyContent="flex-start">
          <Grid item xs={true}>
            <Typography
              id="file-modal-title"
              variant="h5"
              component="h2"
              gutterBottom
            >
              Testing
            </Typography>
          </Grid>
          <Grid item xs={1} style={{ textAlign: "end" }}>
            <IconButton
              aria-label="close-modal"
              color="default"
              style={{ padding: 0 }}
              onClick={handleClose}
              size="large"
            >
              <CloseIcon style={{ cursor: "pointer" }} />
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs align="center">
        {modalContent({
          meta,
          apiUrl,
          windowDimensions,
          previewDimensions,
          setPreviewDimensions,
        })}
      </Grid>

      {0 && (
        <Grid
          item
          xs
          style={{ overflowY: "auto", width: previewDimensions.width }}
        >
          <Typography id="file-modal-description" variant="body1" gutterBottom>
            {meta.description} {link}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
  return (
    <div
      className={styles.banner}
      //
    >
      <Grid container direction="row" spacing={2}>
        <Grid item>
          <div>
            We use cookies to enable functionality on our website and track
            usage.
          </div>
          <div>
            For more information, please refer to our{" "}
            <a href="https://www.sanger.ac.uk/policies/cookies/">
              cookie policy
            </a>
          </div>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            disableElevation
            className={classes.button}
            //   startIcon={<SearchIcon />}
            onClick={() => setCookie("cookieConsent", "essential")}
          >
            Accept Essential
          </Button>
        </Grid>

        <Grid item>
          <Button
            variant="contained"
            disableElevation
            className={classes.button}
            //   startIcon={<SearchIcon />}
            onClick={() => setCookie("cookieConsent", "all")}
          >
            Accept All
          </Button>
        </Grid>

        <Grid item>
          <Button
            variant="contained"
            disableElevation
            className={classes.button}
            //   startIcon={<SearchIcon />}
            //   onClick={handleClick}
            onClick={handleOpen}
          >
            Cookie Settings
          </Button>
        </Grid>
      </Grid>
      {/* <div>Accept Essential</div>
      <div>Accept All</div>
      <div>Cookie Settings</div> */}
      {children}
      <Modal
        open={open}
        onClose={(event, reason) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }}
        aria-labelledby="file-modal-title"
        aria-describedby="file-modal-description"
      >
        {body}
      </Modal>
    </div>
  );
};

export default compose(withCookies)(CookieBanner);
