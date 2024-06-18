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

export const progressComplete = async (queryId) => {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      if (progress[queryId]) {
        if (progress[queryId].complete) {
          resolve(progress[queryId]);
          clearInterval(interval);
        }
      } else {
        resolve(false);
      }
    }, 1000);
  });
};

export const clearProgress = (queryId) => {
  if (progress[queryId]) {
    delete progress[queryId];
  }
};
