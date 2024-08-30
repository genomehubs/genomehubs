import { useLocation, useNavigate } from "@reach/router";

import React from "react";
// import Pagination from "@mui/lab/Pagination";
import TablePagination from "@mui/material/TablePagination";
import classnames from "classnames";
import { compose } from "recompose";
import makeStyles from "@mui/styles/makeStyles";
import qs from "../functions/qs";
import styles from "./Styles.scss";
import { useLocalStorage } from "usehooks-ts";
import withSearch from "../hocs/withSearch";

const useStyles = makeStyles((theme) => ({
  root: {
    "& > *": {
      marginTop: "16px",
    },
  },
}));

const SearchPagination = ({
  searchTerm,
  searchResults,
  setSearchTerm,
  setPreferSearchTerm,
  searchIndex,
}) => {
  if (!searchResults.status || !searchResults.status.hits) {
    return null;
  }
  const navigate = useNavigate();
  const location = useLocation();
  let pageSize = searchResults.status.size;
  let offset = searchResults.status.offset;
  let resultCount = searchResults.status.hits;
  let count = Math.ceil(resultCount / pageSize);
  let page = offset / pageSize;
  let options = { ...searchTerm };
  let index = searchIndex || "taxon";
  const [savedOptions, setSavedOptions] = useLocalStorage(
    `${index}Options`,
    {}
  );
  const handleChange = (event, newPage) => {
    options.offset = newPage * pageSize;
    // setPreferSearchTerm(true);
    // setSearchTerm(options);
    navigate(
      `${location.pathname}?${qs.stringify(options)}${location.hash || ""}`
    );
  };
  const handleChangeRowsPerPage = (event) => {
    options.offset = 0;
    options.size = parseInt(event.target.value, 10);
    // setPreferSearchTerm(true);
    // setSearchTerm(options);
    setSavedOptions({ ...savedOptions, size: options.size });
    navigate(
      `${location.pathname}?${qs.stringify(options)}${location.hash || ""}`
    );
  };
  if (resultCount <= 10) {
    return null;
  }
  return (
    <TablePagination
      rowsPerPageOptions={[10, 25, 50, 100]}
      component="div"
      count={resultCount}
      rowsPerPage={pageSize}
      page={page}
      onPageChange={handleChange}
      onRowsPerPageChange={handleChangeRowsPerPage}
    />
  );
};

export default compose(withSearch)(SearchPagination);
