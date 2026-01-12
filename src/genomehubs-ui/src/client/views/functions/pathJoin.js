/**
 * Safely join basename with a path, preventing double slashes
 * @param {string} base - The basename (e.g., "/", "/genomehubs", "")
 * @param {string} path - The path to append (e.g., "search", "/search")
 * @returns {string} - Normalized path (e.g., "/search", "/genomehubs/search")
 */
export const pathJoin = (base, path) => {
  const cleanBase = String(base || "").replace(/\/+$/, ""); // remove trailing slashes
  const cleanPath = String(path || "").replace(/^\/+/, ""); // remove leading slashes

  if (!cleanBase) {
    return `/${cleanPath}`;
  }

  return `${cleanBase}/${cleanPath}`;
};

export default pathJoin;
