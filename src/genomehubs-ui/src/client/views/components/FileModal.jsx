import React, { Fragment, useLayoutEffect, useRef, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { compose } from "redux";
import makeStyles from "@mui/styles/makeStyles";
import useWindowDimensions from "#hooks/useWindowDimensions";
import withApi from "#hocs/withApi";

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
    backgroundColor: theme.palette.background.paper,
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
  if (meta.size_pixels) {
    if (!src) {
      let [width, height] = meta.size_pixels.split("x");
      let ratio = height / width;
      let modalWidth = windowDimensions.width * 0.6;
      let modalHeight = windowDimensions.height * 0.6;
      if (width / height > modalWidth / modalHeight) {
        let imgWidth = Math.min(width, modalWidth);
        setPreviewDimensions({ width: imgWidth, height: imgWidth * ratio });
      } else {
        let imgHeight = Math.min(height, modalHeight);
        setPreviewDimensions({ width: imgHeight / ratio, height: imgHeight });
      }

      setSrc(`${apiUrl}/download?recordId=${meta.file_id}&streamFile=true`);
    }

    return loading ? (
      <Fragment>
        <img
          onError={handleError}
          onLoad={handleLoad}
          style={{ display: "none" }}
          src={src}
        />
        <Skeleton
          variant="rectangular"
          width={previewDimensions.width}
          height={previewDimensions.height}
        />
      </Fragment>
    ) : (
      <img
        src={src}
        style={{
          width: `${previewDimensions.width}px`,
          height: `${previewDimensions.height}px`,
        }}
      />
    );
  }
};

export const FileModal = ({ meta, apiUrl, link, children }) => {
  const classes = useStyles();
  // getModalStyle is not a pure function, we roll the style only on the first render
  const [modalStyle] = React.useState(getModalStyle);
  const [open, setOpen] = React.useState(false);
  const windowDimensions = useWindowDimensions();
  const [previewDimensions, setPreviewDimensions] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
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
      <Grid style={{ width: previewDimensions.width }}>
        <Grid container direction="row" justifyContent="flex-start">
          <Grid size="grow">
            <Typography
              id="file-modal-title"
              variant="h5"
              component="h2"
              gutterBottom
            >
              {meta.title || meta.name}
            </Typography>
          </Grid>
          <Grid style={{ textAlign: "end" }} size={1}>
            <IconButton
              aria-label="close-modal"
              color="default"
              style={{ padding: "0px" }}
              onClick={handleClose}
              size="large"
            >
              <CloseIcon style={{ cursor: "pointer" }} />
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
      <Grid align="center">
        {modalContent({
          meta,
          apiUrl,
          windowDimensions,
          previewDimensions,
          setPreviewDimensions,
        })}
      </Grid>

      {meta.description && (
        <Grid style={{ overflowY: "auto", width: previewDimensions.width }}>
          <Typography id="file-modal-description" variant="body1" gutterBottom>
            {meta.description} {link}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
  return (
    <div onClick={handleOpen}>
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

export default compose(withApi)(FileModal);
