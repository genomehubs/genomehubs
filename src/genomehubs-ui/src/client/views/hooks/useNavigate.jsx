import { getBasename } from "#reducers/location";
import { useNavigate as useReachNavigate } from "@reach/router";

/**
 * Custom hook that wraps @reach/router's useNavigate to automatically
 * handle basename prefix. Ensures basename is always included in paths
 * and never duplicated.
 *
 * Usage:
 *   const navigate = useNavigate();
 *   navigate("/search?q=test"); // → navigates to /archive/search?q=test if basename is "archive"
 *   navigate("/archive/search"); // → still navigates to /archive/search (no duplication)
 */
const useNavigate = () => {
  const reachNavigate = useReachNavigate();
  const basename = getBasename();

  return (to, options) => {
    // Handle relative paths and external URLs
    if (!to || typeof to !== "string") {
      return reachNavigate(to, options);
    }

    // Don't modify external URLs or protocol-relative URLs
    if (
      to.startsWith("http://") ||
      to.startsWith("https://") ||
      to.startsWith("//")
    ) {
      return reachNavigate(to, options);
    }

    // Don't modify hash-only navigation
    if (to.startsWith("#")) {
      return reachNavigate(to, options);
    }

    // If no basename is set, navigate as-is
    if (!basename) {
      return reachNavigate(to, options);
    }

    // Ensure basename starts with /
    const normalizedBasename = basename.startsWith("/")
      ? basename
      : `/${basename}`;

    // If path already starts with basename, don't duplicate it
    if (to.startsWith(normalizedBasename + "/") || to === normalizedBasename) {
      return reachNavigate(to, options);
    }

    // Prepend basename to the path
    const pathWithBasename = to.startsWith("/")
      ? `${normalizedBasename}${to}`
      : `${normalizedBasename}/${to}`;

    return reachNavigate(pathWithBasename, options);
  };
};

export default useNavigate;
