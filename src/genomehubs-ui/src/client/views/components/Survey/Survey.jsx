import { Button, ButtonGroup } from "@mui/material";
import { useEffect, useState } from "react";

import AggregationIcon from "#components/AggregationIcon";
import CloseIcon from "@mui/icons-material/Close";
import Grid from "@mui/material/Grid";
import LaunchIcon from "@mui/icons-material/Launch";
import LinearScaleIcon from "@mui/icons-material/LinearScale";
import { blockquote as blockquoteStyle } from "../Styles.scss";
import { useReadLocalStorage } from "usehooks-ts";

const Survey = ({
  id,
  title,
  minWidth = "600px",
  maxWidth = "900px",
  onDismissOnce,
  onDismissForever,
  onShowMore,
  url,
  dismissable,
  feedbackOptions,
  children,
}) => {
  const [hidden, setHidden] = useState(false);
  const [surveyStatus, setSurveyStatus] = useState(
    useReadLocalStorage(`surveyStatus:${id}`) || "active",
  );

  // return null if id not set or if user has dismissed forever
  useEffect(() => {
    if (!id) {
      setHidden(true);
      return;
    }

    if (surveyStatus === "dismissedForever") {
      setHidden(true);
    }
  }, [id, surveyStatus]);
  if (hidden) {
    return null;
  }

  const handleDismissOnce = () => {
    setHidden(true);
    onDismissOnce?.(); // Call handleDismissOnce on blur
  };

  const handleDismissForever = () => {
    localStorage.setItem(
      `surveyStatus:${id}`,
      JSON.stringify("dismissedForever"),
    );
    setSurveyStatus("dismissedForever");
    setHidden(true);
    onDismissForever?.(); // Call handleDismissForever on blur
  };

  const handleShowMore = () => {
    if (onShowMore) {
      onShowMore();
    } else {
      window.open(url, "_blank");
    }
  };

  if (!children) {
    return null;
  }

  let feedbackButtons = null;
  if (feedbackOptions) {
    feedbackButtons = feedbackOptions.map((option) => (
      <Button
        key={option.label}
        href={option.url}
        target="_blank"
        rel="noreferrer"
        variant="small"
      >
        {option.label}
      </Button>
    ));
  }

  return (
    <Grid
      container
      direction="row"
      justifyContent={"center"}
      style={{ marginBottom: "1em", width: "100%" }}
    >
      <Grid
        style={{
          marginBottom: "1em",
          minWidth,
          maxWidth,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <blockquote className={blockquoteStyle} style={{ margin: 0 }}>
          {/* show close icon in top right corner */}
          {dismissable && (
            <CloseIcon
              onClick={handleDismissOnce}
              style={{ float: "right", cursor: "pointer" }}
            />
          )}
          {title && (
            <h2 style={{ marginTop: "0.25em", marginBottom: "0.5em" }}>
              {title}
            </h2>
          )}
          {children}
          {(url || dismissable) && (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                marginTop: "1em",
              }}
            >
              {url && (
                <Button
                  onClick={handleShowMore}
                  variant="contained"
                  endIcon={<LaunchIcon />}
                >
                  Learn more
                </Button>
              )}
              {dismissable && (
                <ButtonGroup variant="text">
                  <Button onClick={handleDismissOnce}>Dismiss</Button>

                  <Button onClick={handleDismissForever}>
                    Don&apos;t show again
                  </Button>
                </ButtonGroup>
              )}
            </div>
          )}
          {feedbackButtons && (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "end",
                marginBottom: "-0.5em",
              }}
            >
              {feedbackButtons}
            </div>
          )}
        </blockquote>
      </Grid>
    </Grid>
  );
};

export default Survey;
