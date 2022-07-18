export const getArchive = () => {
  if (
    window &&
    window.process &&
    window.process.ENV &&
    window.process.ENV.GH_ARCHIVE
  ) {
    return window.process.ENV.GH_ARCHIVE;
  }
  return ARCHIVE || [];
};

export const archive = getArchive();
