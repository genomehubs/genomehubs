import Citation from "../Citation";
import DownloadButton from "../DownloadButton";
import Grid from "@mui/material/Grid";
import LinkButton from "../LinkButton";
import ResultModalControl from "../ResultModalControl";
import SearchPagination from "../SearchPagination";
import { useMemo } from "react";

/**
 * Custom hook to build table footer with controls and citation
 * Memoizes the result to prevent unnecessary recalculations
 */
export const useTableFooter = ({
  rows = [],
  searchTerm = {},
  saveSearchResults,
  rootRef,
  classes = {},
}) => {
  return useMemo(() => {
    // Build citation message if there are results
    let citationMessage;
    if (rows.length > 0) {
      citationMessage = (
        <Citation resultCount={rows.length} searchTerm={searchTerm} />
      );
    }

    // Build footer controls
    let footer = null;
    if (rows.length > 0) {
      footer = (
        <>
          <Grid
            container
            alignItems="center"
            justifyContent="center"
            direction="row"
            spacing={1}
            size={10}
            className={classes.root}
          >
            <Grid>
              <LinkButton options={["search", "searchurl"]} />
            </Grid>
            <Grid>
              <SearchPagination />
            </Grid>
            <Grid style={{ marginLeft: "auto" }}>
              <DownloadButton
                onButtonClick={saveSearchResults}
                searchTerm={searchTerm}
              />
            </Grid>
            <ResultModalControl
              // currentRecordId={recordId}
              // attributeId={attribute}
              // showAttribute={showAttribute}
              // setShowAttribute={setShowAttribute}
              rootRef={rootRef}
            />
          </Grid>
          {citationMessage}
        </>
      );
    }

    return footer;
  }, [rows.length, searchTerm, saveSearchResults, rootRef, classes.root]);
};
