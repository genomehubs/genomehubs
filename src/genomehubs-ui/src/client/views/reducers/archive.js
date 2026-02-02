export const getArchive = () => {
  // Prefer runtime config if present
  try {
    if (
      typeof window !== "undefined" &&
      window.process &&
      window.process.ENV &&
      window.process.ENV.GH_ARCHIVE !== undefined
    ) {
      const val = window.process.ENV.GH_ARCHIVE;
      // Normalize to array
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        const s = val.trim();
        if (s === "" || s === "false") return [];
        return s.split(/\s+/).filter(Boolean);
      }
      return [];
    }
  } catch {}
  // Fallback to build-time constant (already an array)
  try {
    return ARCHIVE || [];
  } catch {}
  return [];
};

export const archive = getArchive();
