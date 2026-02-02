import Grid from "@mui/material/Grid";
import NavLink from "./NavLink";
import { compose } from "redux";
import { link as linkStyle } from "./Styles.scss";
import { pathJoin } from "#reducers/location";
import qs from "#functions/qs";
import useNavigate from "#hooks/useNavigate";
import withSiteName from "#hocs/withSiteName";

const Citation = ({
  basename,
  searchTerm,
  resultCount,
  siteName,
  siteNameLong,
  citationUrl,
}) => {
  const navigate = useNavigate();
  if (resultCount == 0) {
    return null;
  }

  const showSources = (e) => {
    e.preventDefault();
    navigate(
      `${pathJoin(basename, "search")}?${qs.stringify({
        ...searchTerm,
        report: "sources",
      })}#${encodeURIComponent(searchTerm.query || searchTerm.x)}`,
    );
  };
  let sourcesLink;
  if (!searchTerm.report || searchTerm.report != "sources") {
    sourcesLink = (
      <a
        href=""
        onClick={showSources}
        className={linkStyle}
        style={{ textDecoration: "underline" }}
      >
        sources
      </a>
    );
  } else {
    sourcesLink = <a>sources, listed below</a>;
  }
  // Compose the citation line depending on availability of citationUrl
  const citationNode = citationUrl ? (
    <>
      When using these data, please cite{" "}
      <NavLink href={citationUrl} title="external:" className={linkStyle}>
        {siteNameLong || siteName || "this resource"}
      </NavLink>{" "}
      and the original data {sourcesLink}
    </>
  ) : (
    <>When using these data, please cite the original data {sourcesLink}</>
  );

  return (
    <Grid
      container
      direction="row"
      justifyContent={"center"}
      style={{ marginBottom: "-1em", width: "100%" }}
    >
      <Grid>
        <blockquote style={{ margin: 0 }}>{citationNode}</blockquote>
      </Grid>
    </Grid>
  );
};

export default compose(withSiteName)(Citation);
