/**
 * Mock fetch for testing API calls
 * Usage:
 *   mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: 'test' }) })
 */
export const mockFetch = (response = {}) => {
  const defaults = {
    ok: true,
    status: 200,
    json: async () => response,
    text: async () => JSON.stringify(response),
  };

  global.fetch.mockResolvedValueOnce({
    ...defaults,
    ...response,
  });
};

export const mockFetchError = (error = "Network error") => {
  global.fetch.mockRejectedValueOnce(new Error(error));
};

export const mockFetchResponse = (response, ok = true, status = 200) => {
  global.fetch.mockResolvedValueOnce({
    ok,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
};

/**
 * Reset all fetch mocks
 */
export const resetFetchMocks = () => {
  global.fetch.mockClear();
};

/**
 * Get all fetch calls made during test
 */
export const getFetchCalls = () => {
  return global.fetch.mock.calls;
};

/**
 * Get the last fetch call made
 */
export const getLastFetchCall = () => {
  const calls = getFetchCalls();
  return calls[calls.length - 1];
};
