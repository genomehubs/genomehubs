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
      return window.process.ENV.GH_BASENAME.replace(/^\/+/, "");
    }
  } catch {}
  // Fallback to build-time global if present
  try {
    // BASENAME is provided by webpack DefinePlugin

    const base = BASENAME || "";
    return base.replace(/^\/+/, "");
  } catch {}
  return "";
})();

export const history = createBrowserHistory({
  basename: runtimeBasename,
});

export default history;
