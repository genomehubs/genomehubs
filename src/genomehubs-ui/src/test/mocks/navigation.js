/**
 * Mock React Router navigation
 */
export const mockNavigate = vi.fn();

export const mockUseNavigate = () => {
  return mockNavigate;
};

export const mockUseLocation = (override = {}) => {
  return {
    pathname: "/",
    search: "",
    hash: "",
    state: null,
    ...override,
  };
};

/**
 * Mock window.location
 */
export const mockLocation = (url = "http://localhost/") => {
  delete window.location;
  window.location = new URL(url);
};

/**
 * Reset navigation mocks
 */
export const resetNavigationMocks = () => {
  mockNavigate.mockClear();
};
