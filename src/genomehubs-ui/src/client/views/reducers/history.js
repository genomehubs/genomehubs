import { createBrowserHistory } from "history";

// Avoid circular imports with location.js by reading runtime config directly
const runtimeBasename = (() => {
  try {
    if (
      typeof window !== "undefined" &&
      window.process &&
      window.process.ENV &&
      window.process.ENV.GH_BASENAME
    ) {
      return window.process.ENV.GH_BASENAME;
    }
  } catch {}
  // Fallback to build-time global if present
  try {
    // BASENAME is provided by webpack DefinePlugin
    // eslint-disable-next-line no-undef
    return BASENAME || "";
  } catch {}
  return "";
})();

export const history = createBrowserHistory({
  basename: runtimeBasename,
});

export default history;
