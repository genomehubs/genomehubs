import { ErrorBoundary } from "react-error-boundary";
import React from "react";
import ReactErrorPage from "./ReactErrorPage";
import { compose } from "recompose";
import withSiteName from "../hocs/withSiteName";

export default function ReactErrorBoundary({ children, basename }) {
  return (
    <ErrorBoundary
      FallbackComponent={ReactErrorPage}
      onError={(error, errorInfo) => {
        // log the error
        console.log("Error caught!");
        console.error(error);
        console.error(errorInfo);
      }}
      onReset={() => {
        // reload the previous page
        // or switch to the home page
        console.log("reloading the page...");
        console.log(window.history);
        window.location.assign(basename || "/");
        // window.location.reload();

        // other reset logic...
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

compose(withSiteName)(ReactErrorBoundary);
