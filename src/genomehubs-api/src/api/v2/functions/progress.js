let progress = {};

export const getProgress = (queryId) => {
  return progress[queryId] || false;
};

export const setProgress = (queryId, options) => {
  progress[queryId] = {
    ...(progress[queryId] || {}),
    ...options,
  };
};

export const isProgressComplete = (queryId) => {
  if (progress[queryId]) {
    if (progress[queryId].complete) {
      return true;
    }
  } else {
    return false;
  }
};

export const clearProgress = (queryId) => {
  if (progress[queryId]) {
    delete progress[queryId];
  }
};
