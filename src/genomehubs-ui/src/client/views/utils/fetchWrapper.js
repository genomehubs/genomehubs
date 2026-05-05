/**
 * Fetch Error Handling Wrapper
 * Centralized error handling for all data fetches
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Timeout handling
 * - Network error detection
 * - Error logging and telemetry
 * - Graceful degradation
 * - Per-request AbortController (fixes global controller issue)
 *
 * Usage:
 *   import { fetchWithErrorHandling } from '../utils/fetchWrapper';
 *   const data = await fetchWithErrorHandling('/api/search?query=Homo', {
 *     method: 'GET',
 *     retryCount: 3,
 *     timeout: 5000,
 *   });
 */

import { isFeatureFlagEnabled } from "./featureFlags";

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
  NETWORK_ERROR: "NETWORK_ERROR", // No response (offline, DNS failure, etc.)
  TIMEOUT_ERROR: "TIMEOUT_ERROR", // Request exceeded timeout
  BAD_REQUEST: "BAD_REQUEST", // 400-499 status codes
  SERVER_ERROR: "SERVER_ERROR", // 500-599 status codes
  JSON_ERROR: "JSON_ERROR", // Failed to parse response JSON
  ABORT_ERROR: "ABORT_ERROR", // Request was aborted
  UNKNOWN_ERROR: "UNKNOWN_ERROR", // Unexpected error
};

/**
 * Retry strategies
 */
const RETRY_STRATEGIES = {
  // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms
  EXPONENTIAL_BACKOFF: (attemptNumber) => Math.pow(2, attemptNumber) * 100,

  // Linear backoff: 500ms, 1000ms, 1500ms, 2000ms
  LINEAR_BACKOFF: (attemptNumber) => (attemptNumber + 1) * 500,

  // No retry
  NONE: () => 0,
};

/**
 * Determine if an error is retryable
 * @param {Error} error - The error to check
 * @param {string} errorType - Type of error
 * @param {number} statusCode - HTTP status code (if applicable)
 * @returns {boolean} - Whether this error should trigger a retry
 */
const isRetryable = (error, errorType, statusCode) => {
  // Network errors are retryable (temporary connectivity issues)
  if (errorType === ERROR_TYPES.NETWORK_ERROR) return true;

  // Timeout errors are retryable
  if (errorType === ERROR_TYPES.TIMEOUT_ERROR) return true;

  // 5xx server errors are retryable
  if (errorType === ERROR_TYPES.SERVER_ERROR) return true;

  // 429 (too many requests) is retryable
  if (statusCode === 429) return true;

  // 4xx errors (except 429) are not retryable
  if (statusCode >= 400 && statusCode < 500) return false;

  // Default: don't retry unknown errors
  return false;
};

/**
 * Determine error type from error/response
 * @param {Error} error - The error object
 * @param {Response} response - The fetch response (if available)
 * @returns {string} - Error type constant
 */
const getErrorType = (error, response) => {
  // Abort error (request was cancelled)
  if (error instanceof DOMException && error.name === "AbortError") {
    return ERROR_TYPES.ABORT_ERROR;
  }

  // Timeout (AbortSignal timeout triggered)
  if (error?.message?.includes("abort") || error?.name === "AbortError") {
    return ERROR_TYPES.TIMEOUT_ERROR;
  }

  // Network error (no response)
  if (!response) {
    return ERROR_TYPES.NETWORK_ERROR;
  }

  // Bad request (4xx)
  if (response.status >= 400 && response.status < 500) {
    return ERROR_TYPES.BAD_REQUEST;
  }

  // Server error (5xx)
  if (response.status >= 500) {
    return ERROR_TYPES.SERVER_ERROR;
  }

  // JSON parsing error
  if (error?.message?.includes("JSON")) {
    return ERROR_TYPES.JSON_ERROR;
  }

  return ERROR_TYPES.UNKNOWN_ERROR;
};

/**
 * Main fetch wrapper with error handling
 *
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {string} options.method - HTTP method (GET, POST, etc.)
 * @param {object} options.headers - HTTP headers
 * @param {any} options.body - Request body
 * @param {number} options.timeout - Timeout in milliseconds (default: 30000)
 * @param {number} options.retryCount - Number of retries (default: 3)
 * @param {string} options.retryStrategy - Retry strategy name (default: 'EXPONENTIAL_BACKOFF')
 * @param {boolean} options.logErrors - Whether to log errors (default: true)
 * @param {function} options.onRetry - Callback when retry happens
 * @param {object} options.signal - AbortSignal for cancellation
 * @returns {Promise<Response>} - The fetch response
 * @throws {FetchError} - Enhanced error with context
 */
export const fetchWithErrorHandling = async (url, options = {}) => {
  const {
    method = "GET",
    headers = {},
    body = undefined,
    timeout = 30000,
    retryCount = 3,
    retryStrategy = "EXPONENTIAL_BACKOFF",
    logErrors = true,
    onRetry = undefined,
    signal: externalSignal = undefined,
  } = options;

  const isEnabled = isFeatureFlagEnabled("CENTRALIZED_ERROR_HANDLING");
  if (!isEnabled) {
    // If feature flag is disabled, fall back to plain fetch
    return fetch(url, {
      method,
      headers,
      body,
      signal: externalSignal,
    });
  }

  let lastError;
  let lastResponse;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // Create per-request AbortController (fixes window.controller issue)
      const controller = new AbortController();
      const timeoutId = timeout
        ? setTimeout(() => controller.abort(), timeout)
        : null;

      // Merge signals: use provided signal if available, otherwise use controller signal
      const signal = externalSignal || controller.signal;

      // Perform fetch
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal,
      });

      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);

      // Check for successful response
      if (response.ok) {
        return response;
      }

      lastResponse = response;
      const errorType = getErrorType(null, response);

      // Check if error is retryable
      if (
        attempt < retryCount &&
        isRetryable(null, errorType, response.status)
      ) {
        const delayMs = RETRY_STRATEGIES[retryStrategy](attempt);
        if (logErrors) {
          console.warn(
            `[Fetch] ${response.status} error on ${url}. Retry ${attempt + 1}/${retryCount} after ${delayMs}ms`,
          );
        }
        if (onRetry) {
          onRetry({ attempt, delayMs, status: response.status, url });
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // Not retryable, throw error
      throw new FetchError(
        `HTTP ${response.status}: ${response.statusText}`,
        errorType,
        response.status,
        url,
        response,
      );
    } catch (error) {
      lastError = error;

      // Determine error type
      const errorType = getErrorType(error, lastResponse);

      // Check if retryable
      if (
        attempt < retryCount &&
        isRetryable(error, errorType, lastResponse?.status)
      ) {
        const delayMs = RETRY_STRATEGIES[retryStrategy](attempt);
        if (logErrors) {
          console.warn(
            `[Fetch] ${errorType} on ${url}. Retry ${attempt + 1}/${retryCount} after ${delayMs}ms`,
          );
        }
        if (onRetry) {
          onRetry({ attempt, delayMs, errorType, url });
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // Not retryable or max retries exceeded
      throw new FetchError(
        error.message,
        errorType,
        lastResponse?.status,
        url,
        lastResponse,
        error,
      );
    }
  }

  // Should not reach here, but fallback
  throw (
    lastError ||
    new FetchError("Unknown fetch error", ERROR_TYPES.UNKNOWN_ERROR, null, url)
  );
};

/**
 * Enhanced error class for fetch errors
 * Provides context for error handling and logging
 */
export class FetchError extends Error {
  constructor(message, errorType, statusCode, url, response, originalError) {
    super(message);
    this.name = "FetchError";
    this.errorType = errorType;
    this.statusCode = statusCode;
    this.url = url;
    this.response = response;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage() {
    switch (this.errorType) {
      case ERROR_TYPES.NETWORK_ERROR:
        return "Network connection failed. Please check your internet connection.";
      case ERROR_TYPES.TIMEOUT_ERROR:
        return "Request timed out. The server is taking too long to respond.";
      case ERROR_TYPES.BAD_REQUEST:
        return "Invalid request. Please check your input.";
      case ERROR_TYPES.SERVER_ERROR:
        return "Server error. The service is temporarily unavailable.";
      case ERROR_TYPES.JSON_ERROR:
        return "Failed to parse response. The server returned invalid data.";
      case ERROR_TYPES.ABORT_ERROR:
        return "Request was cancelled.";
      default:
        return "An unexpected error occurred.";
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryable() {
    return isRetryable(this.originalError, this.errorType, this.statusCode);
  }

  /**
   * Serialize error for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errorType: this.errorType,
      statusCode: this.statusCode,
      url: this.url,
      timestamp: this.timestamp,
      userMessage: this.getUserMessage(),
    };
  }
}

/**
 * JSON fetch wrapper (auto-parses response as JSON)
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
export const fetchJsonWithErrorHandling = async (url, options = {}) => {
  const response = await fetchWithErrorHandling(url, options);

  try {
    return await response.json();
  } catch (error) {
    throw new FetchError(
      "Failed to parse JSON response",
      ERROR_TYPES.JSON_ERROR,
      response.status,
      url,
      response,
      error,
    );
  }
};

/**
 * Create a fetch context for multi-related requests
 * Allows cancellation of all requests in a group
 *
 * Usage:
 *   const context = createFetchContext();
 *   await Promise.all([
 *     fetchWithErrorHandling(url1, { signal: context.signal }),
 *     fetchWithErrorHandling(url2, { signal: context.signal }),
 *   ]);
 *   context.abort(); // Cancel all if needed
 */
export const createFetchContext = () => {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    abort: () => controller.abort(),
    isAborted: () => controller.signal.aborted,
  };
};

/**
 * Default export for backwards compatibility
 */
export default {
  fetchWithErrorHandling,
  fetchJsonWithErrorHandling,
  createFetchContext,
  FetchError,
  ERROR_TYPES,
};
