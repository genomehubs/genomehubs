import {
  error as errorStyle,
  infoPage as infoPageStyle,
  link as linkStyle,
} from "./Styles.scss";

import FileCopyIcon from "@mui/icons-material/FileCopy";
import IconButton from "@mui/material/IconButton";
import SiteName from "./SiteName";
import Tooltip from "./Tooltip";
import { compose } from "redux";
import { useRef } from "react";
import withColors from "#hocs/withColors";
import withSiteName from "#hocs/withSiteName";

export const ReactErrorPage = ({
  statusColors,
  siteName,
  basename,
  resetErrorBoundary,
  error,
}) => {
  //   return <div>Test plain div</div>;
  const errorRef = useRef(null);
  return (
    <div className={"error-page"}>
      <header
        xs={12}
        className={errorStyle}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          resetErrorBoundary();
        }}
      >
        <div style={{ float: "left" }}>
          <SiteName logo />
        </div>
      </header>
      <div className={infoPageStyle}>
        <div>
          <h1>Something went wrong</h1>
          <p>Sorry, we encountered an error loading this page:</p>
          <h2 style={{ marginLeft: "2em", color: statusColors.ancestral }}>
            <pre>{error.message}</pre>
          </h2>
          <p>
            You can try refreshing{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.reload();
              }}
            >
              the page
            </a>{" "}
            or go back to the{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.assign(basename || "/");
              }}
            >
              homepage
            </a>
            .
          </p>
          <p>
            If the problem persists, please report it to us by creating an issue
            in our{" "}
            <a
              className={linkStyle}
              href="https://github.com/genomehubs/genomehubs/issues"
              target="_blank"
            >
              github repository
            </a>
            . Let us know what you were trying to do and the URL of this page
            and we'll try to fix it as soon as possible.
          </p>
          <p>Example message:</p>
          <Tooltip title={"Copy to clipboard"} arrow placement={"top"}>
            <IconButton
              aria-label="copy to clipboard"
              size="small"
              onClick={() => {
                console.log(error.message);
                navigator.clipboard.writeText(errorRef.current.innerText);
              }}
              style={{ float: "right" }}
            >
              <FileCopyIcon />
            </IconButton>
          </Tooltip>

          <p
            ref={errorRef}
            contentEditable
            suppressContentEditableWarning
            style={{
              margin: "1em 2em",
              padding: "1em",
              maxWidth: "calc(100vw - 4em)",
              overflow: "auto",
              border: "1px solid #bbbbbb",
            }}
          >
            I was trying to open a page on {siteName} but it went to a `
            {error.message}` error message instead.
            <br />
            <br />
            The URL of the page I was trying to load is:
            <br />
            <a href="#">{window.location.href}</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default compose(withColors, withSiteName)(ReactErrorPage);
