# Phase 1: Data Fetch Call Sites Inventory

**Status**: Phase 1 - Baseline & Controls  
**Last Updated**: May 2026  
**Scope**: All direct fetch() calls across genomehubs-ui selectors and utilities

## Overview

This inventory catalogs all direct fetch() call sites in the codebase. Each entry identifies:

- **Endpoint**: API endpoint being called
- **Method**: GET/POST
- **Error Handling**: How errors are caught/logged
- **Retry Logic**: Automatic retry or single attempt
- **Cancellation**: Uses window.controller or other abort mechanism
- **Data Transform**: Post-fetch processing (JSON, arrayBuffer, etc.)
- **Caching**: In-memory or Redux state caching

**Critical Finding**: All fetch calls currently **lack centralized error handling** and use **global `window.controller` singleton** for cancellation (architectural debt).

---

## 1. Search Endpoints

### FETCH-001: Search Query (GET)

| Property           | Value                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **File**           | `search.js`                                                                                            |
| **Lines**          | 75-95                                                                                                  |
| **Endpoint**       | `/search`                                                                                              |
| **Method**         | GET                                                                                                    |
| **URL Pattern**    | `${apiUrl}/search?${queryString}`                                                                      |
| **Query Params**   | query, result, fields, sortBy, sortOrder, size, offset, taxonomy, includeDescendants, includeEstimates |
| **Error Handling** | Try-catch; logs to console; re-dispatches with fallback query if no results                            |
| **Retry Logic**    | **YES** - Retries with different tax_name/tax_tree on empty results                                    |
| **Cancellation**   | None (bare fetch)                                                                                      |
| **Data Transform** | JSON response; includes retry/fallback logic                                                           |
| **Caching**        | Redux state (receiveSearch)                                                                            |
| **Status**         | WRAP with centralized error handler (Phase 1)                                                          |

**Implementation Pattern**:

```javascript
const response = await fetch(url);
json = await response.json();
if (!json.results || json.results.length == 0) {
  // Retry with fallback query
}
```

**Issues**:

- No timeout handling
- No abort signal (request cannot be cancelled mid-flight)
- Console.log errors not proper logging

---

### FETCH-002: Batch Search (POST)

| Property           | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| **File**           | `search.js`                                                            |
| **Lines**          | 210-240                                                                |
| **Endpoint**       | `/msearch`                                                             |
| **Method**         | POST                                                                   |
| **URL Pattern**    | `${apiUrl}/msearch`                                                    |
| **Request Body**   | `{ searches: [...] }` (batch of search objects)                        |
| **Error Handling** | Try-catch; basic error dispatch                                        |
| **Retry Logic**    | No                                                                     |
| **Cancellation**   | None                                                                   |
| **Data Transform** | JSON response; transforms into grouped result format with displayLimit |
| **Caching**        | Redux state (receiveSearch)                                            |
| **Status**         | WRAP with centralized error handler (Phase 1)                          |

**Implementation Pattern**:

```javascript
const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ searches: normalizedSearches }),
});
json = await response.json();
```

**Issues**:

- No timeout
- No abort signal
- Complex error handling for batch results

---

## 2. Report Endpoints

### FETCH-003: Report Query (GET)

| Property           | Value                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------------- | --------- | --- | ------- | -------- |
| **File**           | `report.js`                                                                               |
| **Lines**          | 195-230                                                                                   |
| **Endpoint**       | `/report`                                                                                 |
| **Method**         | GET                                                                                       |
| **URL Pattern**    | `${apiUrl}/report?query=...&report=tree                                                   | histogram | map | scatter | arc&...` |
| **Query Params**   | query, report, result, taxonomy, reportThreshold, treeThreshold (report-type specific)    |
| **Error Handling** | Try-catch; checks `window.controller.signal.aborted` to distinguish cancellation vs error |
| **Retry Logic**    | No (progress polling handles long-running reports)                                        |
| **Cancellation**   | **YES** - Uses `window.controller.signal` for AbortController                             |
| **Data Transform** | JSON response; wraps in status object on error                                            |
| **Caching**        | Redux state (receiveReport with reportId)                                                 |
| **Status**         | MIGRATE (Phase 2) + add per-request abort (Phase 1.5)                                     |

**Implementation Pattern**:

```javascript
const response = await fetch(url, {
  signal: window.controller.signal,
});
json = await response.json();
// Error handling distinguishes abort vs network error
if (window.controller.signal.aborted && !hideMessage) {
  // Cancellation
} else {
  // Error
}
```

**Issues**:

- Depends on global `window.controller` singleton
- Multiple concurrent report requests will interfere (shared AbortController)
- Missing timeout

---

### FETCH-004: Tree Report (GET)

| Property           | Value                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| **File**           | `tree.js`                                                                          |
| **Lines**          | 55-75                                                                              |
| **Endpoint**       | `/report?report=tree`                                                              |
| **Method**         | GET                                                                                |
| **URL Pattern**    | `${apiUrl}/report?report=tree&x=${uriEncode(query)}&y=...&result=...&taxonomy=...` |
| **Query Params**   | x (encoded query), y (optional), result, taxonomy, includeEstimates                |
| **Error Handling** | Try-catch; logs to console                                                         |
| **Retry Logic**    | No                                                                                 |
| **Cancellation**   | None                                                                               |
| **Data Transform** | JSON response                                                                      |
| **Caching**        | Redux state (receiveNodes)                                                         |
| **Status**         | CONSOLIDATE into report builder (Phase 2)                                          |

**Issues**:

- Manual URI encoding instead of using centralized builder
- No cancellation support

---

## 3. Metadata Endpoints

### FETCH-005: Phylopic Images (GET + Binary)

| Property           | Value                                                                                |
| ------------------ | ------------------------------------------------------------------------------------ |
| **File**           | `phylopic.js`                                                                        |
| **Lines**          | 40-65                                                                                |
| **Endpoint**       | `/phylopic`                                                                          |
| **Method**         | GET (primary) + GET (secondary for image file)                                       |
| **URL Pattern**    | `${apiUrl}/phylopic?taxonId=${encoded}&taxonomy=...`                                 |
| **Query Params**   | taxonId, taxonomy                                                                    |
| **Error Handling** | Try-catch; silent failure (catches error, continues)                                 |
| **Retry Logic**    | Yes - Includes exponential backoff (50-100ms random delays) to avoid thundering herd |
| **Cancellation**   | None                                                                                 |
| **Data Transform** | Primary: JSON; Secondary: arrayBuffer → base64 data URI                              |
| **Caching**        | Redux state (receivePhylopic); memoized by taxonId                                   |
| **Status**         | CONSOLIDATE into apiBuilder (Phase 2)                                                |

**Implementation Pattern**:

```javascript
// Retry logic with random backoff
for (let i = 0; i < 10; i++) {
  await timeout(50 + Math.floor(Math.random() * 50));
  // Check if already fetching
}
// Fetch phylopic metadata
const response = await fetch(url);
// Secondary fetch for image file
json.phylopic.dataUri = await fetch(json.phylopic.fileUrl)
  .then((response) => response.arrayBuffer())
  .then((buffer) => `data:image/png;base64,${btoa(binary)}`);
```

**Issues**:

- Retry logic duplicated here; should be centralized
- Binary handling scattered across selectors
- No timeout for image fetch

---

### FETCH-006: Record Data (GET)

| Property           | Value                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| **File**           | `record.js`                                                                  |
| **Lines**          | 45-65                                                                        |
| **Endpoint**       | `/record`                                                                    |
| **Method**         | GET                                                                          |
| **URL Pattern**    | `${apiUrl}/record?recordId=${encoded}&result=...&taxonomy=...&groups=...`    |
| **Query Params**   | recordId, result, taxonomy, groups                                           |
| **Error Handling** | Try-catch; silent on error                                                   |
| **Retry Logic**    | No                                                                           |
| **Cancellation**   | None                                                                         |
| **Data Transform** | JSON response; extracts record ID by type (taxon, assembly, feature, sample) |
| **Caching**        | Redux state (receiveRecord); memoized by recordId                            |
| **Status**         | CONSOLIDATE into recordBuilder (Phase 2)                                     |

---

### FETCH-007: Taxonomies (GET)

| Property           | Value                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| **File**           | `taxonomy.js`                                                         |
| **Lines**          | 25-50                                                                 |
| **Endpoint**       | `/taxonomies` + `/indices`                                            |
| **Method**         | GET                                                                   |
| **URL Pattern**    | `${apiUrl}/taxonomies` and `${apiUrl}/indices`                        |
| **Query Params**   | None                                                                  |
| **Error Handling** | Try-catch; silent on error                                            |
| **Retry Logic**    | Yes - Sets apiAttempt counter on failure, application can retry       |
| **Cancellation**   | None                                                                  |
| **Data Transform** | JSON array                                                            |
| **Caching**        | Redux state (receiveTaxonomies, receiveIndices); checked before fetch |
| **Status**         | CONSOLIDATE into taxonomyBuilder (Phase 2)                            |

**Issues**:

- Two sequential fetches; should be combined or parallelized

---

### FETCH-008: Result Fields/Types (GET)

| Property           | Value                                            |
| ------------------ | ------------------------------------------------ |
| **File**           | `types.js`                                       |
| **Lines**          | 505-525                                          |
| **Endpoint**       | `/resultFields`                                  |
| **Method**         | GET                                              |
| **URL Pattern**    | `${apiUrl}/resultFields?result=...&taxonomy=...` |
| **Query Params**   | result, taxonomy                                 |
| **Error Handling** | Try-catch; silent on error                       |
| **Retry Logic**    | No                                               |
| **Cancellation**   | None                                             |
| **Data Transform** | JSON response; includes index field              |
| **Caching**        | Redux state (receiveTypes); checked before fetch |
| **Status**         | CONSOLIDATE into typeBuilder (Phase 2)           |

---

## 4. Progress Polling

### FETCH-009: Query Progress (GET, Polling)

| Property             | Value                                         |
| -------------------- | --------------------------------------------- |
| **File**             | `checkProgress.js`                            |
| **Lines**            | 20-45                                         |
| **Endpoint**         | `/progress`                                   |
| **Method**           | GET                                           |
| **URL Pattern**      | `${apiUrl}/progress?queryId=...`              |
| **Query Params**     | queryId                                       |
| **Error Handling**   | Try-catch; silent on error                    |
| **Retry Logic**      | No (polling continues regardless)             |
| **Cancellation**     | **YES** - Uses `window.controller.signal`     |
| **Polling Interval** | Configurable (default 5000ms, 30000ms in UI)  |
| **Data Transform**   | JSON response; extracts progress object       |
| **Status**           | WRAP with centralized error handler (Phase 1) |

**Implementation Pattern**:

```javascript
const fetchProgress = async () => {
  if (iteration > 0 && !isFetching) {
    try {
      isFetching = true;
      const response = await fetch(url, {
        signal: window.controller.signal,
      });
      json = await response.json();
    } catch (error) {
      isFetching = false;
    }
  }
  iteration++;
};
let interval = setInterval(fetchProgress, delay);
```

**Issues**:

- Long-running polling; uses global AbortController
- No exponential backoff on error
- Manual state tracking (isFetching flag)

---

## 5. Summary/Explore Endpoints

### FETCH-010: Summary Data (GET)

| Property           | Value                                                                           |
| ------------------ | ------------------------------------------------------------------------------- |
| **File**           | `explore.js`                                                                    |
| **Lines**          | 30-45                                                                           |
| **Endpoint**       | `/summary`                                                                      |
| **Method**         | GET                                                                             |
| **URL Pattern**    | `${apiUrl}/summary?recordId=...&result=...&taxonomy=...&summary=...&fields=...` |
| **Query Params**   | recordId, result, taxonomy, summary, fields                                     |
| **Error Handling** | Try-catch; silent on error                                                      |
| **Retry Logic**    | No                                                                              |
| **Cancellation**   | None                                                                            |
| **Data Transform** | JSON response; scales and transforms for D3 visualization                       |
| **Caching**        | Redux state (receiveSummary); memoized by ID                                    |
| **Status**         | CONSOLIDATE into summaryBuilder (Phase 2)                                       |

---

## 6. Descendants Endpoints

### FETCH-011: Descendants Search (GET, Loop)

| Property           | Value                                                               |
| ------------------ | ------------------------------------------------------------------- |
| **File**           | `descendants.js`                                                    |
| **Lines**          | 38-70                                                               |
| **Endpoint**       | `/search`                                                           |
| **Method**         | GET                                                                 |
| **URL Pattern**    | `${apiUrl}/search?query=tax_tree(taxonId) AND tax_depth(depth)&...` |
| **Query Params**   | query (complex), fields=none, sortBy, sortOrder, size, offset       |
| **Error Handling** | Try-catch; silent on error                                          |
| **Retry Logic**    | Yes - Loops up to 30 depth levels; breaks when results found        |
| **Cancellation**   | None                                                                |
| **Data Transform** | JSON response; extracts results and count                           |
| **Caching**        | Redux state (receiveDescendants); memoized by taxonId               |
| **Status**         | CONSOLIDATE into descendantsBuilder (Phase 2)                       |

**Issues**:

- Complex loop logic; up to 30 sequential fetches in worst case
- Manual URL encoding for tax_tree() query
- Should support parallel requests or single query

---

## 7. File/Analysis Exports

### FETCH-012: Analysis Search (GET)

| Property           | Value                                   |
| ------------------ | --------------------------------------- |
| **File**           | `analysis.js`                           |
| **Lines**          | 20-35                                   |
| **Endpoint**       | `/search`                               |
| **Method**         | GET                                     |
| **URL Pattern**    | `${apiUrl}/search?${queryString}`       |
| **Query Params**   | All search params (same as FETCH-001)   |
| **Error Handling** | Try-catch; silent on error              |
| **Retry Logic**    | No                                      |
| **Cancellation**   | None                                    |
| **Data Transform** | JSON response; logs query string        |
| **Caching**        | Redux state (receiveAnalyses)           |
| **Status**         | CONSOLIDATE (uses same search endpoint) |

---

### FETCH-013: File Search (GET)

| Property           | Value                                   |
| ------------------ | --------------------------------------- |
| **File**           | `file.js`                               |
| **Lines**          | 20-35                                   |
| **Endpoint**       | `/search`                               |
| **Method**         | GET                                     |
| **URL Pattern**    | `${apiUrl}/search?${queryString}`       |
| **Query Params**   | All search params                       |
| **Error Handling** | Try-catch; silent on error              |
| **Retry Logic**    | No                                      |
| **Cancellation**   | None                                    |
| **Data Transform** | JSON response                           |
| **Caching**        | Redux state (receiveFiles)              |
| **Status**         | CONSOLIDATE (uses same search endpoint) |

---

## 8. Content/Markdown Pages

### FETCH-014: Markdown Content (GET, Fallback)

| Property           | Value                                                          |
| ------------------ | -------------------------------------------------------------- |
| **File**           | `pages.js`                                                     |
| **Lines**          | 30-75                                                          |
| **Endpoint**       | `/assets/markdown/*` (primary) + webpack dev server (fallback) |
| **Method**         | GET                                                            |
| **URL Pattern**    | `${basePrefix}/assets/markdown/${normalizedPath}`              |
| **Query Params**   | None                                                           |
| **Error Handling** | Try-catch with fallback chain: API → webpack → failure         |
| **Retry Logic**    | Yes - Tries 3 different sources                                |
| **Cancellation**   | None                                                           |
| **Data Transform** | Text response; checks content-type header                      |
| **Caching**        | Redux state (receivePages); memoized by pageId                 |
| **Status**         | RETAIN (content loading, not API)                              |

**Implementation Pattern**:

```javascript
try {
  // Attempt 1: API endpoint
  const apiResponse = await fetch(apiUrl);
  if (apiResponse.ok && contentType.includes("text/plain")) {
    markdown = await apiResponse.text();
  } else {
    // Attempt 2: webpack bundled static
    const webpackResponse = await fetch(webpackUrl);
    if (webpackResponse.ok) {
      markdown = await webpackResponse.text();
    }
  }
} catch (error) {
  // Attempt 3: webpack dev server fallback
  const webpackResponse = await fetch(webpackUrl);
}
```

**Issues**:

- Complex fallback chain; should be streamlined
- Loads markdown at runtime; should be pre-bundled

---

## Summary Table: All Fetch Call Sites

| ID        | File             | Endpoint              | Method | Error Handling | Retry          | Cancellation      | Caching | Phase 1 Action                      |
| --------- | ---------------- | --------------------- | ------ | -------------- | -------------- | ----------------- | ------- | ----------------------------------- |
| FETCH-001 | search.js        | `/search`             | GET    | Try-catch      | YES (fallback) | None              | Redux   | Wrap + MIGRATE Phase 2              |
| FETCH-002 | search.js        | `/msearch`            | POST   | Try-catch      | No             | None              | Redux   | Wrap + MIGRATE Phase 2              |
| FETCH-003 | report.js        | `/report`             | GET    | Try-catch      | No             | window.controller | Redux   | Replace window.controller Phase 1.5 |
| FETCH-004 | tree.js          | `/report?report=tree` | GET    | Try-catch      | No             | None              | Redux   | CONSOLIDATE Phase 2                 |
| FETCH-005 | phylopic.js      | `/phylopic`           | GET×2  | Try-catch      | YES (backoff)  | None              | Redux   | CONSOLIDATE Phase 2                 |
| FETCH-006 | record.js        | `/record`             | GET    | Try-catch      | No             | None              | Redux   | CONSOLIDATE Phase 2                 |
| FETCH-007 | taxonomy.js      | `/taxonomies`         | GET×2  | Try-catch      | Partial        | None              | Redux   | CONSOLIDATE Phase 2                 |
| FETCH-008 | types.js         | `/resultFields`       | GET    | Try-catch      | No             | None              | Redux   | CONSOLIDATE Phase 2                 |
| FETCH-009 | checkProgress.js | `/progress`           | GET    | Try-catch      | No             | window.controller | Polling | Wrap Phase 1                        |
| FETCH-010 | explore.js       | `/summary`            | GET    | Try-catch      | No             | None              | Redux   | CONSOLIDATE Phase 2                 |
| FETCH-011 | descendants.js   | `/search`             | GET    | Try-catch      | YES (loop)     | None              | Redux   | CONSOLIDATE Phase 2                 |
| FETCH-012 | analysis.js      | `/search`             | GET    | Try-catch      | No             | None              | Redux   | CONSOLIDATE Phase 2                 |
| FETCH-013 | file.js          | `/search`             | GET    | Try-catch      | No             | None              | Redux   | CONSOLIDATE Phase 2                 |
| FETCH-014 | pages.js         | `/assets/markdown/*`  | GET    | Try-catch      | YES (fallback) | None              | Redux   | RETAIN                              |

---

## Critical Global Issues

### Issue 1: `window.controller` Global Singleton

**Files**: report.js (line 206), checkProgress.js (line 23)  
**Problem**: Single AbortController shared across ALL concurrent requests  
**Risk**: Cancelling one request cancels all in-flight requests  
**Example**:

```javascript
// Request A
const response = await fetch(url1, { signal: window.controller.signal });

// Request B (concurrent)
const response = await fetch(url2, { signal: window.controller.signal });

// If A is cancelled, B is also aborted (WRONG!)
window.controller.abort(); // Aborts both
```

**Solution** (Phase 1.5): Per-request AbortController in adapter layer  
**Timeline**: Must be fixed before Phase 2 migration

---

### Issue 2: No Centralized Error Handling

**All Files**: Every fetch uses try-catch directly  
**Problems**:

- Inconsistent error logging (console.log, silent, or dispatch)
- No retry strategy
- No timeout handling
- No circuit breaker pattern
- No telemetry

**Solution** (Phase 1): Create `fetchWrapper.js` with:

- Centralized error logging
- Configurable retry with exponential backoff
- Timeout support
- Error event dispatch

---

### Issue 3: Timeout Missing Everywhere

**All Files**: No fetch timeout handling  
**Problem**: Requests can hang indefinitely  
**Solution**: Add AbortController with timeout:

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
try {
  const response = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeoutId);
}
```

---

### Issue 4: Console.log for Errors

**Files**: Multiple selectors use console.log instead of proper logging  
**Example**: `json = console.log("An error occured.", error);` (note: typo "occured")  
**Solution**: Use centralized error logger

---

## Error Handling Patterns Currently Used

### Pattern A: Try-Catch with Silent Failure

```javascript
try {
  const response = await fetch(url);
  json = await response.json();
} catch (error) {
  // Silent - no logging or dispatch
}
```

**Used In**: phylopic.js, record.js, taxonomy.js, types.js, explore.js, descendants.js, analysis.js, file.js  
**Risk**: Errors invisible to user and developers

---

### Pattern B: Try-Catch with Console Log

```javascript
try {
  const response = await fetch(url);
  json = await response.json();
} catch (error) {
  json = console.log("An error occured.", error); // Wrong: console.log returns undefined
}
```

**Used In**: search.js, tree.js, taxonomy.js, types.js  
**Risk**: Variables set to undefined; logic breaks downstream

---

### Pattern C: Try-Catch with Dispatch

```javascript
try {
  // fetch logic
} catch (err) {
  dispatch(cancelSearch);
  return dispatch(setApiStatus(false));
}
```

**Used In**: search.js, descendants.js, analysis.js, file.js  
**Risk**: Inconsistent error state; some dispatch cancel, some setApiStatus

---

### Pattern D: Fetch with Signal (Cancellation Aware)

```javascript
try {
  const response = await fetch(url, { signal: window.controller.signal });
  json = await response.json();
} catch (error) {
  if (window.controller.signal.aborted) {
    // User cancelled
  } else {
    // Network error
  }
}
```

**Used In**: report.js, checkProgress.js  
**Issue**: Depends on global window.controller

---

## Retry Patterns Currently Used

### Pattern 1: Query Fallback (Search)

```javascript
if (!json.results || json.results.length == 0) {
  if (params.result == "taxon" && !searchTerm.match(/[()<>=\n*]/)) {
    params.query = `tax_name(${searchTerm})`; // Retry with different query
    dispatch(fetchSearchResults(params, navigate));
  }
}
```

### Pattern 2: Loop Retry (Descendants)

```javascript
for (depth; depth < maxDepth; depth++) {
  // Fetch and check results
  if (json.status.success && json.status.hits >= 1) {
    // Found results, break
  }
}
```

### Pattern 3: Backoff Delay (Phylopic)

```javascript
for (let i = 0; i < 10; i++) {
  await timeout(50 + Math.floor(Math.random() * 50)); // Random backoff
  if (!getPhylopicIsFetching(state)) {
    break;
  }
}
```

### Pattern 4: Incremental Retry (Taxonomy)

```javascript
if (json && json.length == 0) {
  dispatch(setApiAttempt(getApiAttempt(state) + 1)); // Increment retry counter
  dispatch(setApiStatus(false));
}
```

---

## Phase 1 Action Items

### High Priority

- [ ] **Create `src/client/views/utils/fetchWrapper.js`**
  - Centralized fetch wrapper with:
    - Configurable timeout (default 30s)
    - Exponential backoff retry (default 3 attempts)
    - Centralized error logging
    - Error event dispatch to message reducer
  - Export: `fetchWithErrorHandling(url, options, { timeout, retries, onError })`

- [ ] **Document all 14 fetch call sites**
  - Mark each as: WRAP / MIGRATE / CONSOLIDATE / RETAIN
  - Identify retry logic duplications
  - Flag timeout-critical vs background fetches

- [ ] **Identify window.controller usage**
  - List all concurrent report + progress polling scenarios
  - Plan per-request AbortController migration

### Medium Priority

- [ ] **Create timeout recommendations table**
  - Search: 30s
  - Reports (tree, histogram, map): 60s
  - Progress polling: 120s
  - Phylopic: 10s
  - Pages/markdown: 5s

- [ ] **Plan retry strategy document**
  - Which endpoints benefit from retry (search fallback, descendants loop)
  - Which should fail fast (metadata)
  - Exponential backoff config

### Low Priority

- [ ] **Fix console.log typo pattern**
  - Replace all `json = console.log(...)` with proper error handling

- [ ] **Identify dead retry code**
  - Some retry logic (taxonomy apiAttempt) not used upstream

---

## Dependencies for Phase 2

**Phase 1 Must Complete**:

- Fetch inventory signed off
- Error handling patterns documented
- Timeout strategy defined

**Phase 2 Depends On Phase 1**:

- PHASE2-URL-001 through PHASE2-URL-006: URL builder adapters
- Each builder adapter will wrap fetch calls with error handler
- Per-request AbortController replaces window.controller

---

## References

- Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- AbortController: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
- Redux error handling: See PHASE-1-MIGRATION-LEDGER.md (PHASE1-FETCH-001, PHASE1-FETCH-002)
- Global state: `src/client/views/reducers/api.js`, `src/client/views/reducers/message.js`
- Window controller: `src/client/views/store/index.js` (global state initialization)
