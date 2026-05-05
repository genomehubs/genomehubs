# Phase 1: Feature Flags & Error Handling Implementation

**Status**: Phase 1 - Infrastructure  
**Last Updated**: May 2026  
**Tasks**: 4 & 5 (Feature Flags + Error Handling)

---

## Overview

Phase 1 execution includes two critical infrastructure pieces:

1. **Feature Flag System** - Controls phased rollout of Phase 2+ migrations
2. **Fetch Error Handling Wrapper** - Centralizes error handling for all data fetches

These enable safe, controlled rollout of UI refactoring work across development → staging → production.

---

## Task 4: Feature Flag Infrastructure Setup

### Files Created

- **Location**: `src/client/views/utils/featureFlags.js`
- **Size**: ~250 lines
- **Exports**: 7 functions + 1 constant

### Feature Flags Defined

| Phase | Flag Name                    | Purpose                  | Default |
| ----- | ---------------------------- | ------------------------ | ------- |
| 1     | `CENTRALIZED_ERROR_HANDLING` | Error handling wrapper   | false   |
| 2     | `USE_SDK_SEARCH_BUILDER`     | Search URL builder       | false   |
| 2     | `USE_SDK_REPORT_BUILDER`     | Report URL builder       | false   |
| 2     | `USE_SDK_RECORD_BUILDER`     | Record URL builder       | false   |
| 2     | `USE_SDK_TYPE_BUILDER`       | Types/Taxonomy builder   | false   |
| 2     | `USE_SDK_CHIP_ADAPTER`       | Chip-to-query adapter    | false   |
| 2     | `USE_SDK_API_BUILDER`        | Consolidated API builder | false   |
| 3     | `USE_SDK_URL_COMPAT`         | URL compatibility layer  | false   |
| 3     | `USE_QUERY_ONLY_URLS`        | Remove hash from URLs    | false   |
| 6     | `USE_SDK_REPORT_COMPONENTS`  | SDK report components    | false   |
| 7     | `USE_RTKQUERY_CACHE`         | RTK Query caching        | false   |

### API Reference

#### `isFeatureFlagEnabled(flagName)`

Check if a feature flag is enabled. Reads from environment variable or uses default.

```javascript
import { isFeatureFlagEnabled } from "../utils/featureFlags";

const isEnabled = isFeatureFlagEnabled("CENTRALIZED_ERROR_HANDLING");
if (isEnabled) {
  // Use new error handling
} else {
  // Use legacy error handling
}
```

**Parameters**:

- `flagName` (string): Name of feature flag (e.g., 'CENTRALIZED_ERROR_HANDLING')

**Returns**: boolean

**Environment Variable**: Automatically reads from `REACT_APP_{FLAGNAME}`

**Fallback**: Uses `default` value from flag definition if environment variable not set

---

#### `useFeatureFlag(flagName)`

React hook for using feature flags in components.

```javascript
import { useFeatureFlag } from "../utils/featureFlags";

function MyComponent() {
  const isErrorHandlingEnabled = useFeatureFlag("CENTRALIZED_ERROR_HANDLING");

  return (
    <div>
      {isErrorHandlingEnabled ? <NewErrorHandler /> : <LegacyErrorHandler />}
    </div>
  );
}
```

---

#### `FeatureFlagWrapper`

Component wrapper for conditional rendering based on feature flags.

```javascript
import { FeatureFlagWrapper } from "../utils/featureFlags";

<FeatureFlagWrapper
  flag="CENTRALIZED_ERROR_HANDLING"
  fallback={<OldComponent />}
>
  <NewComponent />
</FeatureFlagWrapper>;
```

---

#### `getAllFeatureFlags()`

Get all feature flags with current state. Useful for debugging.

```javascript
import { getAllFeatureFlags } from "../utils/featureFlags";

const flags = getAllFeatureFlags();
console.log(flags);
// {
//   CENTRALIZED_ERROR_HANDLING: false,
//   USE_SDK_SEARCH_BUILDER: true,
//   ...
// }
```

---

#### `getFeatureFlagsByPhase(phase)`

Get all feature flags for a specific phase.

```javascript
import { getFeatureFlagsByPhase } from "../utils/featureFlags";

const phase2Flags = getFeatureFlagsByPhase(2);
// {
//   USE_SDK_SEARCH_BUILDER: false,
//   USE_SDK_REPORT_BUILDER: true,
//   USE_SDK_RECORD_BUILDER: false,
//   ...
// }
```

---

#### `getFeatureFlagMetadata()`

Get full metadata for all feature flags including phase, description, and current value. For CI/CD integration.

```javascript
import { getFeatureFlagMetadata } from "../utils/featureFlags";

const metadata = getFeatureFlagMetadata();
// {
//   CENTRALIZED_ERROR_HANDLING: {
//     name: 'CENTRALIZED_ERROR_HANDLING',
//     description: '...',
//     phase: 1,
//     default: false,
//     envVar: 'REACT_APP_CENTRALIZED_ERROR_HANDLING',
//     currentValue: false,
//   },
//   ...
// }
```

---

#### `logActiveFeatureFlags()`

Log all active feature flags to console. Call in useEffect on app initialization.

```javascript
import { logActiveFeatureFlags } from "../utils/featureFlags";

useEffect(() => {
  logActiveFeatureFlags();
}, []);

// Console output:
// 🚀 Active feature flags: [USE_SDK_SEARCH_BUILDER, USE_SDK_REPORT_BUILDER]
// [Phase 2] ✓ USE_SDK_SEARCH_BUILDER - Use SDK search query builder...
// [Phase 2] ✓ USE_SDK_REPORT_BUILDER - Use SDK report query builder...
```

---

### Environment Configuration

Feature flags are controlled via environment variables. Set in `.env` file or deployment configuration:

```
# .env (local development)
REACT_APP_CENTRALIZED_ERROR_HANDLING=true
REACT_APP_USE_SDK_SEARCH_BUILDER=false
REACT_APP_USE_SDK_REPORT_BUILDER=true
```

**Environment Variable Naming Pattern**: `REACT_APP_` + flag name

**Deployment**: Set in CI/CD pipeline environment variables or container secrets

---

### Deployment Strategy

#### Development (Local)

```bash
# Enable all Phase 1-2 features
REACT_APP_CENTRALIZED_ERROR_HANDLING=true \
REACT_APP_USE_SDK_SEARCH_BUILDER=true \
npm start
```

#### Staging (Canary Rollout)

```yaml
# k8s deployment config
env:
  - name: REACT_APP_CENTRALIZED_ERROR_HANDLING
    value: "true"
  - name: REACT_APP_USE_SDK_SEARCH_BUILDER
    value: "true" # Canary: only 10% of pods
  - name: REACT_APP_USE_SDK_REPORT_BUILDER
    value: "false" # Not ready yet
```

#### Production (Phased Rollout)

```bash
# Week 1: Error handling only
REACT_APP_CENTRALIZED_ERROR_HANDLING=true
REACT_APP_USE_SDK_SEARCH_BUILDER=false

# Week 2: Add search builder (10% canary)
REACT_APP_CENTRALIZED_ERROR_HANDLING=true
REACT_APP_USE_SDK_SEARCH_BUILDER=true  # canary nodeSelector

# Week 3: Full rollout (100%)
# Same as Week 2 (no nodeSelector)

# Week 4: Add report builder (10% canary)
REACT_APP_USE_SDK_REPORT_BUILDER=true  # canary nodeSelector
```

---

### Verification Script

CI/CD integration: Verify feature flag states match deployment plan

```bash
#!/bin/bash
# scripts/verify-feature-flags.sh

npm run build 2>&1 | grep -E "Active feature flags|Phase"

# Expected output during Phase 2 rollout:
# 🚀 Active feature flags: [USE_SDK_SEARCH_BUILDER, USE_SDK_REPORT_BUILDER]
# [Phase 2] ✓ USE_SDK_SEARCH_BUILDER - Use SDK search query builder...
# [Phase 2] ✓ USE_SDK_REPORT_BUILDER - Use SDK report query builder...
```

---

### Telemetry Integration

Log feature flag states to analytics service:

```javascript
// In app initialization
import { getFeatureFlagMetadata } from "../utils/featureFlags";

const flagsMetadata = getFeatureFlagMetadata();
analytics.logEvent("app_initialized", {
  featureFlags: flagsMetadata,
});
```

---

## Task 5: Fetch Error Handling Wrapper

### Files Created

- **Location**: `src/client/views/utils/fetchWrapper.js`
- **Size**: ~400 lines
- **Exports**: 5 exports (functions, classes, constants)

### Features

✅ **Automatic Retry with Exponential Backoff** - Configurable retry strategy (exponential, linear, none)

✅ **Timeout Handling** - Per-request timeout with configurable duration (default 30s)

✅ **Per-Request AbortController** - Fixes global `window.controller` issue (each request gets its own)

✅ **Network Error Detection** - Distinguishes between network failures, timeouts, 4xx, 5xx errors

✅ **Graceful Degradation** - Falls back to plain fetch when feature flag disabled

✅ **Error Categorization** - 7 error types for fine-grained error handling

✅ **Telemetry-Ready** - Error context for logging and monitoring

---

### Error Types

```javascript
export const ERROR_TYPES = {
  NETWORK_ERROR: "NETWORK_ERROR", // No response (offline, DNS, etc.)
  TIMEOUT_ERROR: "TIMEOUT_ERROR", // Request exceeded timeout
  BAD_REQUEST: "BAD_REQUEST", // 400-499 status codes
  SERVER_ERROR: "SERVER_ERROR", // 500-599 status codes
  JSON_ERROR: "JSON_ERROR", // Failed to parse JSON response
  ABORT_ERROR: "ABORT_ERROR", // Request was aborted/cancelled
  UNKNOWN_ERROR: "UNKNOWN_ERROR", // Unexpected error
};
```

---

### API Reference

#### `fetchWithErrorHandling(url, options)`

Main function for fetch requests with error handling, retry logic, and timeout.

```javascript
import { fetchWithErrorHandling } from "../utils/fetchWrapper";

// Simple usage (all defaults)
const response = await fetchWithErrorHandling("/api/search?query=Homo");
const data = await response.json();

// Advanced usage with options
const response = await fetchWithErrorHandling("/api/report", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "Homo", report: "tree" }),
  timeout: 60000, // 60 second timeout
  retryCount: 5, // Retry up to 5 times
  retryStrategy: "EXPONENTIAL_BACKOFF",
  logErrors: true,
  onRetry: ({ attempt, delayMs, status, url }) => {
    console.log(`Retry attempt ${attempt} after ${delayMs}ms`);
  },
});
```

**Parameters**:

- `url` (string): URL to fetch
- `options` (object):
  - `method` (string): HTTP method (default: 'GET')
  - `headers` (object): HTTP headers (default: {})
  - `body` (any): Request body
  - `timeout` (number): Timeout in milliseconds (default: 30000)
  - `retryCount` (number): Max retries (default: 3)
  - `retryStrategy` (string): 'EXPONENTIAL_BACKOFF', 'LINEAR_BACKOFF', 'NONE' (default: 'EXPONENTIAL_BACKOFF')
  - `logErrors` (boolean): Log retry attempts (default: true)
  - `onRetry` (function): Callback on retry: `(context) => {}`
  - `signal` (AbortSignal): For request cancellation

**Returns**: `Promise<Response>` - Response object

**Throws**: `FetchError` with error context and user message

---

#### `fetchJsonWithErrorHandling(url, options)`

Convenience wrapper that automatically parses response as JSON.

```javascript
import { fetchJsonWithErrorHandling } from "../utils/fetchWrapper";

const data = await fetchJsonWithErrorHandling("/api/search?query=Homo");
// data is already parsed JSON, no need for .json()
```

---

#### `FetchError` Class

Enhanced error class with context for error handling.

```javascript
import { fetchWithErrorHandling, FetchError } from "../utils/fetchWrapper";

try {
  await fetchWithErrorHandling("/api/data");
} catch (error) {
  if (error instanceof FetchError) {
    console.log("Error type:", error.errorType);
    console.log("Status code:", error.statusCode);
    console.log("User message:", error.getUserMessage());
    console.log("Is retryable:", error.isRetryable());
    console.log("Error JSON:", error.toJSON());
  }
}
```

**Methods**:

- `getUserMessage()` - Get user-friendly error message
- `isRetryable()` - Check if error should be retried
- `toJSON()` - Serialize for logging/telemetry

**Properties**:

- `errorType` - One of ERROR_TYPES constants
- `statusCode` - HTTP status code (if applicable)
- `url` - URL that was fetched
- `response` - Fetch Response object (if available)
- `originalError` - Original error (if any)
- `timestamp` - ISO timestamp of error

---

#### `createFetchContext()`

Create a fetch context to cancel multiple related requests together.

```javascript
import {
  fetchWithErrorHandling,
  createFetchContext,
} from "../utils/fetchWrapper";

// Fetch multiple related URLs, share abort signal
const context = createFetchContext();

try {
  const [searchResults, metadata, config] = await Promise.all([
    fetchWithErrorHandling("/api/search?query=Homo", {
      signal: context.signal,
    }),
    fetchWithErrorHandling("/api/metadata", { signal: context.signal }),
    fetchWithErrorHandling("/api/config", { signal: context.signal }),
  ]);
} catch (error) {
  // If one fails, the others are still in-flight
  // But user can cancel all with:
  context.abort();
}
```

**Returns**: Context object with:

- `signal` (AbortSignal) - Share this with all related fetches
- `abort()` - Cancel all fetches using this signal
- `isAborted()` - Check if aborted

---

### Retry Strategies

#### Exponential Backoff (Default)

```javascript
// Delays: 100ms, 200ms, 400ms, 800ms, 1600ms
retryStrategy: "EXPONENTIAL_BACKOFF";
```

**Use for**: Network requests, API calls (safe for server load)

#### Linear Backoff

```javascript
// Delays: 500ms, 1000ms, 1500ms, 2000ms
retryStrategy: "LINEAR_BACKOFF";
```

**Use for**: When exponential might be too aggressive

#### No Retry

```javascript
// No delay between attempts (don't use with retryCount > 0)
retryStrategy: "NONE";
```

**Use for**: One-off operations that shouldn't retry

---

### Usage Patterns

#### Pattern 1: Replace Existing Fetch Calls

**Before**:

```javascript
fetch(`${API_URL}/search?${queryString}`)
  .then((r) => r.json())
  .catch((err) => dispatch(searchError(err)));
```

**After**:

```javascript
import { fetchJsonWithErrorHandling } from "../utils/fetchWrapper";

try {
  const data = await fetchJsonWithErrorHandling(
    `${API_URL}/search?${queryString}`,
  );
  dispatch(receiveSearch(data));
} catch (error) {
  dispatch(searchError(error.getUserMessage()));
}
```

---

#### Pattern 2: Batch Fetch with Shared Signal

**Use case**: Multiple related requests that should cancel together

```javascript
import {
  fetchWithErrorHandling,
  createFetchContext,
} from "../utils/fetchWrapper";

const context = createFetchContext();

try {
  const [search, phylopic, taxonomy] = await Promise.all([
    fetchWithErrorHandling(`/api/search?${query}`, { signal: context.signal }),
    fetchWithErrorHandling(`/api/phylopic/Homo`, { signal: context.signal }),
    fetchWithErrorHandling(`/api/taxonomy`, { signal: context.signal }),
  ]);
} catch (error) {
  if (error instanceof FetchError && error.isRetryable()) {
    // Automatically retried up to retryCount times
    // If still failing, handle error
  }
}
```

---

#### Pattern 3: Error Dispatch with Telemetry

**Use case**: Dispatch Redux actions with error context for monitoring

```javascript
try {
  const data = await fetchJsonWithErrorHandling("/api/data");
  dispatch(receiveData(data));
} catch (error) {
  if (error instanceof FetchError) {
    // Log to monitoring service
    analytics.logError({
      errorType: error.errorType,
      statusCode: error.statusCode,
      url: error.url,
      userMessage: error.getUserMessage(),
      timestamp: error.timestamp,
    });

    // Dispatch appropriate error action
    dispatch(
      dataError({
        message: error.getUserMessage(),
        retry: error.isRetryable(),
      }),
    );
  }
}
```

---

### Activation via Feature Flag

Wrap error handling is only active when feature flag enabled:

```javascript
// Always use fetchWithErrorHandling - it checks feature flag internally
const response = await fetchWithErrorHandling("/api/data");

// If CENTRALIZED_ERROR_HANDLING=false, falls back to plain fetch:
// const response = await fetch('/api/data', { ... });
```

---

### Testing Error Handling

#### Test Timeout Error

```javascript
test("handles timeout error", async () => {
  const response = await fetchWithErrorHandling("/api/slow", {
    timeout: 100, // 100ms timeout
  });
  // Will timeout and retry 3 times (default)
});
```

#### Test Retry on 5xx

```javascript
test("retries on 500 error", async () => {
  // Mock fetch to return 500 first 2 times, then 200
  // Should succeed after 2 retries
});
```

#### Test Non-Retryable 4xx

```javascript
test("does not retry on 400 error", async () => {
  // Should fail immediately without retry
});
```

---

## Phase 1 Exit Criteria

### Feature Flags ✅

- [x] Feature flag system defined (11 flags across 7 phases)
- [x] Environment variable configuration working
- [x] API functions implemented (7 exports)
- [x] React hooks and components provided
- [x] Deployment scripts documented
- [x] Telemetry integration ready

### Error Handling ✅

- [x] Centralized fetch wrapper implemented
- [x] Per-request AbortController (fixes global controller issue)
- [x] 7 error types defined
- [x] Retry strategies (exponential, linear, none)
- [x] Error categorization (retryable vs permanent)
- [x] FetchError class with context
- [x] Timeout handling
- [x] Feature flag integration (graceful fallback)

### Testing Tasks (Phase 1 Wrap-up)

- [ ] Unit tests for feature flag system
- [ ] Unit tests for error handling
- [ ] Integration tests for retry logic
- [ ] E2E tests for error scenarios

### Next Steps (After Task 6)

After Phase 1 exit criteria complete, ready for:

- **Phase 2**: Use feature flags to roll out URL builders
- **Phase 3**: Use feature flags for URL compatibility layer
- **Phase 6**: Use feature flags for report system migration

---

## References

- Feature Flags: `src/client/views/utils/featureFlags.js`
- Error Handling: `src/client/views/utils/fetchWrapper.js`
- Migration Ledger: `PHASE-1-MIGRATION-LEDGER.md` (flag definitions, rollout timeline)
- Fetch Sites: `PHASE-1-FETCH-INVENTORY.md` (14 fetch sites to wrap)
- Report Validation: `PHASE-1-REPORT-VALIDATION-RULES.md` (blocking Phase 2)
